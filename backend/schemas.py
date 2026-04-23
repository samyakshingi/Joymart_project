from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

# --- Society Schemas ---
class SocietyResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

# --- User Schemas ---
class UserCreate(BaseModel):
    society_id: int
    flat_number: str
    phone: str
    name: str
    firebase_token: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    society_id: int
    flat_number: str
    phone: str
    name: str
    society: Optional[SocietyResponse] = None
    model_config = ConfigDict(from_attributes=True)

# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str
    price: float
    discounted_price: Optional[float] = None
    is_available: bool = True
    image_url: Optional[str] = None
    category: str
    stock_count: int = 0

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Coupon Schemas ---
class CouponBase(BaseModel):
    code: str
    discount_percentage: int
    is_active: bool = True
    once_per_user: bool = False

class CouponCreate(CouponBase):
    pass

class CouponResponse(CouponBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Order Item Schemas ---
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_purchase: float
    product: Optional[ProductResponse] = None
    model_config = ConfigDict(from_attributes=True)

# --- Order Schemas ---
class OrderCreate(BaseModel):
    user_id: int
    items: List[OrderItemCreate]
    tip_amount: float = 0
    delivery_instructions: Optional[str] = None
    applied_coupon: Optional[str] = None
    payment_method: str  # Mandatory: 'Cash' or 'UPI'

class OrderResponse(BaseModel):
    id: int
    user_id: int
    order_date: datetime
    total_amount: float
    tip_amount: float
    delivery_instructions: Optional[str] = None
    applied_coupon: Optional[str] = None
    payment_method: str
    status: str
    items: List[OrderItemResponse] = []
    user: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)

class OrderStatusUpdate(BaseModel):
    status: str

# --- Store Schemas ---
class StoreSettingResponse(BaseModel):
    is_open: bool
    model_config = ConfigDict(from_attributes=True)

# --- Supplier Schemas ---
class SupplierBase(BaseModel):
    name: str
    phone: str
    outstanding_balance: float = 0

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class SupplierTransactionCreate(BaseModel):
    amount: float
    transaction_type: str # Invoice, Payment
    description: Optional[str] = None

class SupplierTransactionResponse(BaseModel):
    id: int
    supplier_id: int
    amount: float
    transaction_type: str
    date: datetime
    description: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
