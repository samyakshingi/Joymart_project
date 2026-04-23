from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
import datetime
import csv
import io
from decimal import Decimal
from fastapi.responses import StreamingResponse

import logging
import os

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import models
import schemas
from database import engine, get_db

# Create all tables in the database
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="JoyMart API")

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
def get_or_create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.phone == user.phone).first()
    if db_user:
        # Update details if changed
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

# --- COUPON ENDPOINTS ---
@app.get("/coupons", response_model=List[schemas.CouponResponse])
def get_all_coupons(db: Session = Depends(get_db)):
    return db.query(models.Coupon).all()

@app.get("/coupons/{code}", response_model=schemas.CouponResponse)
def get_coupon(code: str, db: Session = Depends(get_db)):
    coupon = db.query(models.Coupon).filter(models.Coupon.code == code, models.Coupon.is_active == True).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid or inactive coupon code")
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
            discount = (total_amount * coupon.discount_percentage) / 100
    
    # Calculate final total
    final_total = total_amount - discount

    # Business Logic: Free delivery on orders >= 100 (based on subtotal BEFORE coupon), otherwise 30 Rs fee
    if total_amount < 100:
        final_total += 30.0 
    
    # Add tip
    final_total += order_req.tip_amount

    db_order = models.Order(
        user_id=order_req.user_id,
        total_amount=final_total,
        tip_amount=order_req.tip_amount,
        delivery_instructions=order_req.delivery_instructions,
        applied_coupon=order_req.applied_coupon,
        payment_method=order_req.payment_method,
        status="Pending"
    )
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
