from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import datetime

import models
import schemas
from database import engine, get_db

# Create all tables in the database (SQLite for our POC)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="JoyMart API")

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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

# --- ORDER ENDPOINTS ---
@app.get("/orders", response_model=List[schemas.OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).all()

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
        total_amount += float(product.price) * item.quantity
        db_items.append(models.OrderItem(product_id=product.id, quantity=item.quantity, price_at_purchase=product.price))

    # Business Logic: Free delivery on orders >= 100, otherwise 30 Rs fee
    if total_amount < 100:
        total_amount += 30.0 

    db_order = models.Order(
        user_id=order_req.user_id,
        total_amount=total_amount,
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
@app.get("/analytics/today")
def get_analytics_today(db: Session = Depends(get_db)):
    today = datetime.datetime.now(datetime.timezone.utc).date()
    orders = db.query(models.Order).all()
    today_orders = [o for o in orders if o.order_date.date() == today and o.status != "Cancelled"]
    
    total_revenue = sum(float(o.total_amount) for o in today_orders)
    total_orders = len(today_orders)
    
    out_of_stock_count = db.query(models.Product).filter(models.Product.stock_count < 5).count()
    
    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "out_of_stock_count": out_of_stock_count
    }
