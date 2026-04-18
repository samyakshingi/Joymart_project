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

class UserResponse(BaseModel):
    id: int
    society_id: int
    flat_number: str
    phone: str
    name: str
    model_config = ConfigDict(from_attributes=True)

# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str
    price: float
    is_available: bool = True
    image_url: Optional[str] = None
    category: str
    stock_count: int = 0

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
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

class OrderResponse(BaseModel):
    id: int
    user_id: int
    order_date: datetime
    total_amount: float
    status: str
    items: List[OrderItemResponse] = []
    model_config = ConfigDict(from_attributes=True)

class OrderStatusUpdate(BaseModel):
    status: str

# --- Store Schemas ---
class StoreSettingResponse(BaseModel):
    is_open: bool
    model_config = ConfigDict(from_attributes=True)
