from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

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

# --- PRODUCT ENDPOINTS ---
@app.get("/products", response_model=List[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

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

    total_amount = 0.0
    db_items = []
    
    for item in order_req.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Product ID {item.product_id} not found")
        if not product.is_available:
            raise HTTPException(status_code=400, detail=f"Product {product.name} is currently unavailable")
        
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

@app.get("/orders/tracking/{phone}", response_model=List[schemas.OrderResponse])
def track_orders_by_phone(phone: str, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.phone == phone).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="No orders found for this phone number")
    
    # Return orders newest first
    return db.query(models.Order).filter(models.Order.user_id == db_user.id).order_by(models.Order.id.desc()).all()
