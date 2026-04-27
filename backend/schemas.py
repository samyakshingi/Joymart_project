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
    role: str
    wallet_balance: float
    is_blocked: bool
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

# --- Banner Schemas ---
class BannerBase(BaseModel):
    image_url: str
    linked_product_id: Optional[int] = None
    is_active: bool = True

class BannerCreate(BannerBase):
    pass

class BannerResponse(BannerBase):
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
    payment_method: str  # Mandatory: 'Cash', 'UPI', or 'Wallet'
    delivery_slot: Optional[str] = "Immediate"

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
    delivery_slot: Optional[str] = None
    delivery_otp: Optional[str] = None
    delivery_photo_url: Optional[str] = None
    items: List[OrderItemResponse] = []
    user: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)

class OrderStatusUpdate(BaseModel):
    status: str
    submitted_otp: Optional[str] = None
    photo_url: Optional[str] = None

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

# --- Wallet Schemas ---
class WalletRechargeRequest(BaseModel):
    user_id: int
    amount: float

class WalletTransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    transaction_type: str
    status: str
    timestamp: datetime
    user: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)

# --- Saved List Schemas ---
class SavedListItemCreate(BaseModel):
    product_id: int
    quantity: int = 1

class SavedListItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: Optional[ProductResponse] = None
    model_config = ConfigDict(from_attributes=True)

class SavedListCreate(BaseModel):
    user_id: int
    list_name: str
    items: List[SavedListItemCreate] = []

class SavedListResponse(BaseModel):
    id: int
    user_id: int
    list_name: str
    items: List[SavedListItemResponse] = []
    model_config = ConfigDict(from_attributes=True)

# --- Subscription Schemas ---
class SubscriptionCreate(BaseModel):
    user_id: int
    product_id: int
    quantity: int
    frequency: str # "Daily", "Weekly"

class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    quantity: int
    frequency: str
    status: bool
    product: Optional[ProductResponse] = None
    model_config = ConfigDict(from_attributes=True)

# --- System Schemas ---
class VersionCheckResponse(BaseModel):
    force_update: bool
    latest_version: str

