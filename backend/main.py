from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
import datetime
import csv
import io
import random
from decimal import Decimal
from fastapi.responses import StreamingResponse
from PIL import Image

import logging
import os
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import models
import schemas
from database import engine, get_db, SessionLocal
from config import settings
from notifications import send_push_notification

# Create all tables in the database
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME)

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.APP_NAME} API"}

# CORS Configuration
# For production, we would list the specific Vercel domains. 
# For now, allowing all origins is acceptable for the POC, but let's prepare for more control.

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # Changed to False to allow "*" origins safely
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to JoyMart API"}

# --- APSCHEDULER SETUP ---
scheduler = BackgroundScheduler()

def process_daily_subscriptions():
    logger.info("Starting daily subscription processing...")
    db = SessionLocal()
    try:
        # Get active daily subscriptions
        subs = db.query(models.Subscription).filter(
            models.Subscription.status == True,
            models.Subscription.frequency == "Daily"
        ).all()
        
        for sub in subs:
            product = db.query(models.Product).filter(models.Product.id == sub.product_id).first()
            user = db.query(models.User).filter(models.User.id == sub.user_id).first()
            if not product or not user:
                continue
            
            price = product.discounted_price if product.discounted_price else product.price
            cost = price * sub.quantity
            
            if user.wallet_balance >= cost:
                # Deduct balance
                user.wallet_balance -= cost
                
                # Create wallet transaction
                tx = models.WalletTransaction(
                    user_id=user.id,
                    amount=cost,
                    transaction_type="Debit",
                    status="Approved"
                )
                db.add(tx)
                
                # Create Order
                new_order = models.Order(
                    user_id=user.id,
                    total_amount=cost,
                    payment_method="Wallet",
                    status="Pending",
                    delivery_slot="Morning Delivery"
                )
                db.add(new_order)
                db.flush()
                
                # Create Order Item
                new_item = models.OrderItem(
                    order_id=new_order.id,
                    product_id=product.id,
                    quantity=sub.quantity,
                    price_at_purchase=price
                )
                db.add(new_item)
                
                logger.info(f"Subscription processed for user {user.id}, product {product.name}")
            else:
                logger.warning(f"Insufficient funds for user {user.id} subscription")
        
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error processing subscriptions: {e}")
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    scheduler.add_job(
        process_daily_subscriptions,
        CronTrigger(hour=0, minute=1),
        id="daily_subs",
        replace_existing=True
    )
    scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()

# --- STORE SETTINGS ---
def get_store_setting(db: Session):
    setting = db.query(models.StoreSetting).first()
    if not setting:
        setting = models.StoreSetting(is_open=True)
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

@app.get("/store/status", response_model=schemas.StoreSettingResponse)
def get_store_status(db: Session = Depends(get_db)):
    return get_store_setting(db)

@app.put("/store/status", response_model=schemas.StoreSettingResponse)
def update_store_status(is_open: bool, db: Session = Depends(get_db)):
    setting = get_store_setting(db)
    setting.is_open = is_open
    db.commit()
    db.refresh(setting)
    return setting

# --- SOCIETY ENDPOINTS ---
@app.get("/societies", response_model=List[schemas.SocietyResponse])
def get_societies(db: Session = Depends(get_db)):
    return db.query(models.Society).all()

# --- USER ENDPOINTS ---
@app.post("/users", response_model=schemas.UserResponse)
def create_or_update_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.phone == user.phone).first()
    if db_user:
        if db_user.is_blocked:
            raise HTTPException(status_code=403, detail="Account suspended. Please contact support.")
        db_user.name = user.name
        db_user.flat_number = user.flat_number
        db_user.society_id = user.society_id
        db.commit()
        db.refresh(db_user)
        return db_user
        
    db_user = models.User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/{phone}", response_model=schemas.UserResponse)
def get_user_by_phone(phone: str, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.phone == phone).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.is_blocked:
        raise HTTPException(status_code=403, detail="Account suspended. Please contact support.")
    return db_user

@app.get("/users/{phone}/orders", response_model=List[schemas.OrderResponse])
def get_user_orders(phone: str, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.phone == phone).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.is_blocked:
        raise HTTPException(status_code=403, detail="Account suspended. Please contact support.")
    return db.query(models.Order).filter(models.Order.user_id == db_user.id).order_by(models.Order.order_date.desc()).all()

@app.get("/admin/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.put("/admin/users/{user_id}/block", response_model=schemas.UserResponse)
def toggle_user_block(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.is_blocked = not db_user.is_blocked
    db.commit()
    db.refresh(db_user)
    return db_user

# --- PRODUCT ENDPOINTS ---
@app.get("/products", response_model=List[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@app.get("/products/trending", response_model=List[schemas.ProductResponse])
def get_trending_products(db: Session = Depends(get_db)):
    trending = db.query(models.OrderItem.product_id) \
        .group_by(models.OrderItem.product_id) \
        .order_by(func.count(models.OrderItem.id).desc()) \
        .limit(5) \
        .all()
        
    product_ids = [t.product_id for t in trending]
    if not product_ids:
        return []
        
    products = db.query(models.Product).filter(models.Product.id.in_(product_ids)).all()
    products_sorted = sorted(products, key=lambda p: product_ids.index(p.id))
    return products_sorted

@app.post("/products", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.put("/products/{product_id}/availability", response_model=schemas.ProductResponse)
def update_product_availability(product_id: int, is_available: bool, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db_product.is_available = is_available
    db.commit()
    db.refresh(db_product)
    return db_product

@app.put("/products/{product_id}/stock", response_model=schemas.ProductResponse)
def update_product_stock(product_id: int, stock_count: int, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db_product.stock_count = stock_count
    db.commit()
    db.refresh(db_product)
    return db_product

@app.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product_update: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product_update.model_dump().items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if product is in any orders
    in_orders = db.query(models.OrderItem).filter(models.OrderItem.product_id == product_id).first()
    if in_orders:
        raise HTTPException(status_code=400, detail="Cannot delete product because it has been ordered in the past. Try marking it out of stock instead.")
        
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}

# --- COUPON ENDPOINTS ---
@app.get("/coupons", response_model=List[schemas.CouponResponse])
def get_all_coupons(db: Session = Depends(get_db)):
    return db.query(models.Coupon).all()

@app.get("/coupons/{code}", response_model=schemas.CouponResponse)
def get_coupon(code: str, phone: Optional[str] = None, db: Session = Depends(get_db)):
    coupon = db.query(models.Coupon).filter(models.Coupon.code == code, models.Coupon.is_active == True).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid or inactive coupon code")
    
    if coupon.once_per_user and phone:
        user = db.query(models.User).filter(models.User.phone == phone).first()
        if user:
            past_order = db.query(models.Order).filter(
                models.Order.user_id == user.id, 
                models.Order.applied_coupon == code
            ).first()
            if past_order:
                raise HTTPException(status_code=400, detail="You have already used this coupon code.")
                
    return coupon

@app.put("/coupons/{coupon_id}/toggle_status", response_model=schemas.CouponResponse)
def toggle_coupon_status(coupon_id: int, db: Session = Depends(get_db)):
    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    coupon.is_active = not coupon.is_active
    db.commit()
    db.refresh(coupon)
    return coupon

@app.post("/coupons", response_model=schemas.CouponResponse)
def create_coupon(coupon: schemas.CouponCreate, db: Session = Depends(get_db)):
    db_coupon = models.Coupon(**coupon.model_dump())
    db.add(db_coupon)
    db.commit()
    db.refresh(db_coupon)
    return db_coupon

@app.get("/coupons/{code}/usage")
def get_coupon_usage(code: str, db: Session = Depends(get_db)):
    # Query orders with applied_coupon matching code, join with User
    results = db.query(models.Order, models.User).join(
        models.User, models.Order.user_id == models.User.id
    ).filter(models.Order.applied_coupon == code).all()
    
    usage_list = []
    for order, user in results:
        usage_list.append({
            "order_id": order.id,
            "order_date": order.order_date,
            "total_amount": order.total_amount,
            "user_name": user.name,
            "user_phone": user.phone
        })
    return usage_list

# --- ORDER ENDPOINTS ---
@app.get("/orders", response_model=List[schemas.OrderResponse])
def get_orders(date: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Order).order_by(models.Order.order_date.desc())
    if date:
        try:
            target_date = datetime.datetime.strptime(date, "%Y-%m-%d").date()
            orders = query.all()
            return [o for o in orders if o.order_date.date() == target_date]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    return query.all()

@app.post("/orders", response_model=schemas.OrderResponse)
def create_order(order_req: schemas.OrderCreate, db: Session = Depends(get_db)):
    # Validate user exists
    db_user = db.query(models.User).filter(models.User.id == order_req.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.is_blocked:
        raise HTTPException(status_code=403, detail="Account suspended. Please contact support.")

    # Validate store is open
    setting = get_store_setting(db)
    if not setting.is_open:
        raise HTTPException(status_code=400, detail="Store is currently closed. Please try again later.")

    total_amount = 0.0
    db_items = []
    
    for item in order_req.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Product ID {item.product_id} not found")
        if not product.is_available:
            raise HTTPException(status_code=400, detail=f"Product {product.name} is currently unavailable")
            
        if item.quantity > product.stock_count:
            raise HTTPException(status_code=400, detail=f"Cannot order {item.quantity} of {product.name}. Only {product.stock_count} in stock.")
        
        # Decrement stock count
        product.stock_count -= item.quantity
        if product.stock_count <= 0:
            product.is_available = False
        
        # Calculate running total
        effective_price = product.discounted_price if product.discounted_price is not None else product.price
        total_amount += float(effective_price) * item.quantity
        db_items.append(models.OrderItem(product_id=product.id, quantity=item.quantity, price_at_purchase=effective_price))

    # Apply coupon to items subtotal ONLY
    discount = 0.0
    if order_req.applied_coupon:
        coupon = db.query(models.Coupon).filter(models.Coupon.code == order_req.applied_coupon, models.Coupon.is_active == True).first()
        if coupon:
            if coupon.once_per_user:
                past_order = db.query(models.Order).filter(models.Order.user_id == order_req.user_id, models.Order.applied_coupon == order_req.applied_coupon).first()
                if past_order:
                    raise HTTPException(status_code=400, detail="You have already used this coupon code.")
            discount = (total_amount * float(coupon.discount_percentage)) / 100
    
    # Calculate final total
    final_total = total_amount - discount

    # Business Logic: Free delivery on orders >= 100 (based on subtotal BEFORE coupon), otherwise 30 Rs fee
    if total_amount < 100:
        final_total += 30.0 
    
    # Add tip
    final_total += order_req.tip_amount

    # Handle Wallet Payment
    if order_req.payment_method == "Wallet":
        user = db.query(models.User).filter(models.User.id == order_req.user_id).first()
        if user.wallet_balance < final_total:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")
        
        user.wallet_balance -= final_total
        tx = models.WalletTransaction(
            user_id=user.id,
            amount=final_total,
            transaction_type="Debit",
            status="Approved"
        )
        db.add(tx)

    db_order = models.Order(
        user_id=order_req.user_id,
        total_amount=final_total,
        tip_amount=order_req.tip_amount,
        delivery_instructions=order_req.delivery_instructions,
        applied_coupon=order_req.applied_coupon,
        payment_method=order_req.payment_method,
        status="Pending",
        delivery_slot=order_req.delivery_slot
    )
    
    if order_req.payment_method == "Cash":
        db_order.delivery_otp = "".join(random.choices("0123456789", k=4))

    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    for db_item in db_items:
        db_item.order_id = db_order.id
        db.add(db_item)
    
    db.commit()
    db.refresh(db_order)
    return db_order

@app.put("/orders/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(order_id: int, status_update: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    valid_statuses = ["Pending", "Accepted", "OutForDelivery", "Completed", "Cancelled"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if status_update.status == "Completed":
        if db_order.delivery_otp:
            if status_update.submitted_otp != db_order.delivery_otp:
                raise HTTPException(status_code=400, detail="Invalid delivery OTP")
        if status_update.photo_url:
            db_order.delivery_photo_url = status_update.photo_url

    db_order.status = status_update.status
    db.commit()
    db.refresh(db_order)
    return db_order

@app.put("/orders/{order_id}/cancel", response_model=schemas.OrderResponse)
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if db_order.status != "Pending":
        raise HTTPException(status_code=400, detail="Only pending orders can be cancelled")
        
    # Re-stock items!
    for item in db_order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.stock_count += item.quantity
            if product.stock_count > 0:
                product.is_available = True
                
    # Refund Wallet if necessary
    if db_order.payment_method == "Wallet":
        user = db.query(models.User).filter(models.User.id == db_order.user_id).first()
        if user:
            user.wallet_balance += db_order.total_amount
            tx = models.WalletTransaction(
                user_id=user.id,
                amount=db_order.total_amount,
                transaction_type="Credit",
                status="Approved"
            )
            db.add(tx)
                
    db_order.status = "Cancelled"
    db.commit()
    db.refresh(db_order)
    return db_order

@app.get("/orders/tracking/{phone}", response_model=List[schemas.OrderResponse])
def track_orders_by_phone(phone: str, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.phone == phone).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="No orders found for this phone number")
    
    # Return orders newest first
    return db.query(models.Order).filter(models.Order.user_id == db_user.id).order_by(models.Order.id.desc()).all()

@app.get("/orders/frequent/{phone}", response_model=List[schemas.ProductResponse])
def get_frequent_products(phone: str, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.phone == phone).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    frequent = db.query(models.OrderItem.product_id) \
        .join(models.Order) \
        .filter(models.Order.user_id == db_user.id) \
        .group_by(models.OrderItem.product_id) \
        .order_by(func.count(models.OrderItem.id).desc()) \
        .limit(5) \
        .all()
        
    product_ids = [f.product_id for f in frequent]
    if not product_ids:
        return []
        
    products = db.query(models.Product).filter(models.Product.id.in_(product_ids)).all()
    products_sorted = sorted(products, key=lambda p: product_ids.index(p.id))
    return products_sorted

# --- ANALYTICS ENDPOINTS ---
@app.get("/analytics")
def get_analytics(date: Optional[str] = None, db: Session = Depends(get_db)):
    if date:
        try:
            target_date = datetime.datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        target_date = datetime.datetime.now(datetime.timezone.utc).date()
        
    orders = db.query(models.Order).all()
    target_orders = [o for o in orders if o.order_date.date() == target_date and o.status != "Cancelled"]
    
    total_revenue = sum(float(o.total_amount) for o in target_orders)
    total_orders = len(target_orders)
    
    out_of_stock_count = db.query(models.Product).filter(models.Product.stock_count < 5).count()
    
    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "out_of_stock_count": out_of_stock_count
    }

# --- KHATA (SUPPLIER) ENDPOINTS ---
@app.get("/suppliers", response_model=List[schemas.SupplierResponse])
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(models.Supplier).all()

@app.post("/suppliers", response_model=schemas.SupplierResponse)
def create_supplier(supplier: schemas.SupplierCreate, db: Session = Depends(get_db)):
    db_supplier = models.Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@app.post("/suppliers/{supplier_id}/transactions", response_model=schemas.SupplierTransactionResponse)
def create_supplier_transaction(supplier_id: int, transaction: schemas.SupplierTransactionCreate, db: Session = Depends(get_db)):
    db_supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    db_transaction = models.SupplierTransaction(**transaction.model_dump(), supplier_id=supplier_id)
    
    # Update outstanding balance
    if transaction.transaction_type == 'Invoice':
        db_supplier.outstanding_balance += Decimal(str(transaction.amount))
    elif transaction.transaction_type == 'Payment':
        db_supplier.outstanding_balance -= Decimal(str(transaction.amount))
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@app.get("/suppliers/{supplier_id}/transactions", response_model=List[schemas.SupplierTransactionResponse])
def get_supplier_transactions(supplier_id: int, db: Session = Depends(get_db)):
    return db.query(models.SupplierTransaction).filter(models.SupplierTransaction.supplier_id == supplier_id).all()

# --- FINANCIAL REPORTS ---
@app.get("/reports/reconciliation")
def get_reconciliation(db: Session = Depends(get_db)):
    today = datetime.datetime.now(datetime.timezone.utc).date()
    orders = db.query(models.Order).all()
    today_completed = [o for o in orders if o.order_date.date() == today and o.status == "Completed"]
    
    expected_cash = sum(float(o.total_amount) for o in today_completed if o.payment_method == "Cash")
    expected_upi = sum(float(o.total_amount) for o in today_completed if o.payment_method == "UPI")
    
    return {
        "expected_cash": expected_cash,
        "expected_upi": expected_upi,
        "order_count": len(today_completed)
    }

@app.get("/reports/export")
def export_orders_csv(db: Session = Depends(get_db)):
    thirty_days_ago = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)
    orders = db.query(models.Order).filter(models.Order.order_date >= thirty_days_ago).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Order ID", "Date", "Customer ID", "Total Amount", "Tip", "Coupon", "Payment Method", "Status"])
    
    for o in orders:
        writer.writerow([
            o.id,
            o.order_date.strftime("%Y-%m-%d %H:%M:%S"),
            o.user_id,
            o.total_amount,
            o.tip_amount,
            o.applied_coupon or "None",
            o.payment_method,
            o.status
        ])
    
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=orders_export_{datetime.datetime.now().strftime('%Y%m%d')}.csv"}
    )

# --- BANNER ENDPOINTS ---
@app.get("/banners", response_model=List[schemas.BannerResponse])
def get_active_banners(db: Session = Depends(get_db)):
    return db.query(models.Banner).filter(models.Banner.is_active == True).all()

@app.get("/admin/banners", response_model=List[schemas.BannerResponse])
def get_all_banners(db: Session = Depends(get_db)):
    return db.query(models.Banner).all()

@app.post("/banners", response_model=schemas.BannerResponse)
def create_banner(banner: schemas.BannerCreate, db: Session = Depends(get_db)):
    db_banner = models.Banner(**banner.model_dump())
    db.add(db_banner)
    db.commit()
    db.refresh(db_banner)
    return db_banner

@app.put("/banners/{banner_id}/status", response_model=schemas.BannerResponse)
def toggle_banner_status(banner_id: int, is_active: bool, db: Session = Depends(get_db)):
    db_banner = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not db_banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    db_banner.is_active = is_active
    db.commit()
    db.refresh(db_banner)
    return db_banner

@app.delete("/banners/{banner_id}")
def delete_banner(banner_id: int, db: Session = Depends(get_db)):
    db_banner = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not db_banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    db.delete(db_banner)
    db.commit()
    return {"message": "Banner deleted successfully"}

# --- WALLET ENDPOINTS ---
@app.post("/wallet/recharge/request", response_model=schemas.WalletTransactionResponse)
def request_wallet_recharge(req: schemas.WalletRechargeRequest, db: Session = Depends(get_db)):
    tx = models.WalletTransaction(
        user_id=req.user_id,
        amount=req.amount,
        transaction_type="Credit",
        status="Pending"
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

@app.get("/admin/wallet/requests", response_model=List[schemas.WalletTransactionResponse])
def get_wallet_requests(db: Session = Depends(get_db)):
    return db.query(models.WalletTransaction).filter(models.WalletTransaction.status == "Pending").all()

@app.put("/admin/wallet/approve/{transaction_id}", response_model=schemas.WalletTransactionResponse)
async def approve_wallet_request(transaction_id: int, db: Session = Depends(get_db)):
    tx = db.query(models.WalletTransaction).filter(models.WalletTransaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if tx.status != "Pending":
        raise HTTPException(status_code=400, detail="Transaction is not pending")
        
    tx.status = "Approved"
    
    user = db.query(models.User).filter(models.User.id == tx.user_id).first()
    if user:
        user.wallet_balance += tx.amount
        await send_push_notification(user.id, "Wallet Recharged", f"Your wallet has been credited with ₹{tx.amount}")
        
    db.commit()
    db.refresh(tx)
    return tx

# --- SAVED LISTS ENDPOINTS ---
@app.post("/saved-lists", response_model=schemas.SavedListResponse)
def create_saved_list(list_req: schemas.SavedListCreate, db: Session = Depends(get_db)):
    db_list = models.SavedList(user_id=list_req.user_id, list_name=list_req.list_name)
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    
    for item in list_req.items:
        db_item = models.SavedListItem(list_id=db_list.id, product_id=item.product_id, quantity=item.quantity)
        db.add(db_item)
        
    db.commit()
    db.refresh(db_list)
    return db_list

@app.get("/users/{user_id}/saved-lists", response_model=List[schemas.SavedListResponse])
def get_user_saved_lists(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.SavedList).filter(models.SavedList.user_id == user_id).all()

@app.delete("/saved-lists/{list_id}")
def delete_saved_list(list_id: int, db: Session = Depends(get_db)):
    db_list = db.query(models.SavedList).filter(models.SavedList.id == list_id).first()
    if not db_list:
        raise HTTPException(status_code=404, detail="List not found")
    db.delete(db_list)
    db.commit()
    return {"message": "List deleted successfully"}

# --- SUBSCRIPTION ENDPOINTS ---
@app.post("/subscriptions", response_model=schemas.SubscriptionResponse)
def create_subscription(sub_req: schemas.SubscriptionCreate, db: Session = Depends(get_db)):
    db_sub = models.Subscription(**sub_req.model_dump())
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub

@app.get("/users/{user_id}/subscriptions", response_model=List[schemas.SubscriptionResponse])
def get_user_subscriptions(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Subscription).filter(models.Subscription.user_id == user_id).all()

@app.put("/subscriptions/{sub_id}/status", response_model=schemas.SubscriptionResponse)
def toggle_subscription_status(sub_id: int, status: bool, db: Session = Depends(get_db)):
    db_sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id).first()
    if not db_sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    db_sub.status = status
    db.commit()
    db.refresh(db_sub)
    return db_sub

@app.delete("/subscriptions/{sub_id}")
def delete_subscription(sub_id: int, db: Session = Depends(get_db)):
    db_sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id).first()
    if not db_sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    db.delete(db_sub)
    db.commit()
    return {"message": "Subscription deleted successfully"}

# --- SYSTEM ENDPOINTS ---
@app.get("/system/version-check", response_model=schemas.VersionCheckResponse)
def check_app_version(platform: str, current_version: str, db: Session = Depends(get_db)):
    version_info = db.query(models.AppVersion).filter(models.AppVersion.platform == platform).first()
    if not version_info:
        return {"force_update": False, "latest_version": current_version}
    
    # Simple version string comparison (assuming Semantic Versioning X.Y.Z format)
    def parse_version(v):
        return [int(x) for x in v.split('.')]
    
    try:
        current_v = parse_version(current_version)
        min_v = parse_version(version_info.minimum_required_version)
        force_update = current_v < min_v
    except ValueError:
        # If parsing fails, fall back to safe default
        force_update = False
        
    return {"force_update": force_update, "latest_version": version_info.latest_version}

@app.get("/system/master-catalog")
def get_master_catalog(query: str = ""):
    master_db = [
        {"name": "Maggi 2-Minute Noodles 70g", "image_url": "https://joymart-cdn.fake/optimized/maggi_70g.webp", "price": 14},
        {"name": "Amul Butter 100g", "image_url": "https://joymart-cdn.fake/optimized/amul_butter_100g.webp", "price": 54},
        {"name": "Aashirvaad Atta 5kg", "image_url": "https://joymart-cdn.fake/optimized/aashirvaad_atta_5kg.webp", "price": 250},
        {"name": "Tata Salt 1kg", "image_url": "https://joymart-cdn.fake/optimized/tata_salt_1kg.webp", "price": 28},
        {"name": "Surf Excel Easy Wash 1kg", "image_url": "https://joymart-cdn.fake/optimized/surf_excel_1kg.webp", "price": 130}
    ]
    if query:
        return [p for p in master_db if query.lower() in p["name"].lower()]
    return master_db

@app.post("/products/upload-image")
async def upload_product_image(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents))
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
            
        if image.width > 800:
            ratio = 800.0 / image.width
            new_height = int(image.height * ratio)
            image = image.resize((800, new_height), Image.Resampling.LANCZOS)
            
        output = io.BytesIO()
        image.save(output, format="JPEG", quality=70, optimize=True)
        
        # Mocking the S3 upload URL
        mock_url = f"https://joymart-cdn.fake/uploads/prod_{int(datetime.datetime.now().timestamp())}.jpg"
        return {"image_url": mock_url}
    except Exception as e:
        logger.error(f"Image processing failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid image file")
