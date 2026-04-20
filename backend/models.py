from sqlalchemy import Column, Integer, String, Boolean, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Society(Base):
    __tablename__ = "societies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"))
    flat_number = Column(String)
    phone = Column(String, unique=True, index=True)
    name = Column(String)
    firebase_token = Column(String, nullable=True)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Numeric(10, 2))
    discounted_price = Column(Numeric(10, 2), nullable=True)
    is_available = Column(Boolean, default=True)
    image_url = Column(String)
    category = Column(String, index=True)
    stock_count = Column(Integer, default=0)

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    order_date = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    total_amount = Column(Numeric(10, 2))
    tip_amount = Column(Numeric(10, 2), default=0)
    delivery_instructions = Column(String, nullable=True)
    applied_coupon = Column(String, nullable=True)
    payment_method = Column(String, default="Cash") # Cash or UPI
    status = Column(String, default="Pending") # Pending, Accepted, OutForDelivery, Completed, Cancelled

    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    price_at_purchase = Column(Numeric(10, 2))

    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class StoreSetting(Base):
    __tablename__ = "store_settings"
    id = Column(Integer, primary_key=True, index=True)
    is_open = Column(Boolean, default=True)

class Coupon(Base):
    __tablename__ = "coupons"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    discount_percentage = Column(Integer)
    is_active = Column(Boolean, default=True)

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String)
    outstanding_balance = Column(Numeric(10, 2), default=0)

class SupplierTransaction(Base):
    __tablename__ = "supplier_transactions"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    amount = Column(Numeric(10, 2))
    transaction_type = Column(String) # Invoice, Payment
    date = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    description = Column(String, nullable=True)
