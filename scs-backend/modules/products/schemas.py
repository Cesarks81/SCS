from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ProductType(str, Enum):
    COUNTABLE = "countable"
    INDIVIDUAL = "individual"


class ProductStatus(str, Enum):
    OPTIMAL = "Óptimo"
    REPAIR = "En reparación"
    ASSIGNED = "Asignado"
    DECOMMISSIONED = "De baja"


class ProductBase(BaseModel):
    model: str
    type: ProductType
    category: str
    warehouse_id: str
    stock_min: int
    stock_max: int
    stock_safety: int
    attributes: dict[str, str] = Field(default_factory=dict)
    status: ProductStatus = ProductStatus.OPTIMAL
    serial_number: Optional[str] = None
    image_url: Optional[str] = None
    emoji: Optional[str] = None


class ProductCreate(ProductBase):
    current_stock: int = 0


class ProductUpdate(BaseModel):
    model: Optional[str] = None
    type: Optional[ProductType] = None
    category: Optional[str] = None
    warehouse_id: Optional[str] = None
    stock_min: Optional[int] = None
    stock_max: Optional[int] = None
    stock_safety: Optional[int] = None
    attributes: Optional[dict[str, str]] = None
    status: Optional[ProductStatus] = None
    serial_number: Optional[str] = None
    image_url: Optional[str] = None
    emoji: Optional[str] = None


class ProductResponse(ProductBase):
    id: str
    current_stock: int = 0
