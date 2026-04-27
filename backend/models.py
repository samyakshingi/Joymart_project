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
    role = Column(String, default="Customer") # Customer, Admin, Rider
    wallet_balance = Column(Numeric(10, 2), default=0)
    is_blocked = Column(Boolean, default=False)
    
    society = relationship("Society")
    subscriptions = relationship("Subscription", back_populates="user")
    wallet_transactions = relationship("WalletTransaction", back_populates="user")

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
    payment_method = Column(String, default="Cash") # Cash, UPI, Wallet
    status = Column(String, default="Pending") # Pending, Accepted, OutForDelivery, Completed, Cancelled
    delivery_slot = Column(String, nullable=True, default="Immediate") # Immediate, Tomorrow 07:00 AM, etc.
    delivery_otp = Column(String, nullable=True)
    delivery_photo_url = Column(String, nullable=True)

    user = relationship("User")
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

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Numeric(10, 2))
    transaction_type = Column(String) # Credit, Debit
    status = Column(String, default="Pending") # Pending, Approved, Failed
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    user = relationship("User", back_populates="wallet_transactions")

class SavedList(Base):
    __tablename__ = "saved_lists"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    list_name = Column(String)
    
    items = relationship("SavedListItem", back_populates="list", cascade="all, delete-orphan")

class SavedListItem(Base):
    __tablename__ = "saved_list_items"
    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("saved_lists.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)

    list = relationship("SavedList", back_populates="items")
    product = relationship("Product")

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    frequency = Column(String) # Daily, Weekly
    status = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="subscriptions")
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
    once_per_user = Column(Boolean, default=False)

class Banner(Base):
    __tablename__ = "banners"
    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String)
    linked_product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    is_active = Column(Boolean, default=True)

    product = relationship("Product")

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

class AppVersion(Base):
    __tablename__ = "app_versions"
    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String, index=True) # ios, android, web
    latest_version = Column(String)
    minimum_required_version = Column(String)
