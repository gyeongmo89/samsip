from fastapi import FastAPI, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine, get_db, Base, SessionLocal
from pydantic import BaseModel
from typing import Optional, List
import logging
from datetime import date
from sqlalchemy.orm import joinedload

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경에서는 모든 origin 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
@app.on_event("startup")
async def startup_event():
    logger.info("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully!")
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise e
    logger.info("Database initialization completed!")


# Pydantic models
class SupplierBase(BaseModel):
    name: str
    contact: Optional[str] = None
    address: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: int

    class Config:
        from_attributes = True

class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None

class ItemResponse(ItemBase):
    id: int

    class Config:
        from_attributes = True

class UnitBase(BaseModel):
    name: str

class UnitResponse(UnitBase):
    id: int

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    supplier_id: int
    item_id: int
    unit_id: int
    quantity: float
    price: float
    total: float
    payment_cycle: str
    payment_method: str
    client: str
    notes: Optional[str] = None
    date: Optional[str] = None

class OrderResponse(OrderBase):
    id: int
    supplier: SupplierResponse
    item: ItemResponse
    unit: UnitResponse

    class Config:
        from_attributes = True

# API endpoints
@app.post("/suppliers/", response_model=SupplierResponse)
def create_supplier(supplier: SupplierBase, db: Session = Depends(get_db)):
    try:
        db_supplier = models.Supplier(
            name=supplier.name,
            contact=supplier.contact,
            address=supplier.address  # address 필드를 비고로 사용
        )
        db.add(db_supplier)
        db.commit()
        db.refresh(db_supplier)
        return db_supplier
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/suppliers/", response_model=List[SupplierResponse])
def read_suppliers(db: Session = Depends(get_db)):
    suppliers = db.query(models.Supplier).all()
    print(f"Found suppliers: {[f'{s.id}: {s.name}' for s in suppliers]}")
    return suppliers

@app.delete("/suppliers/bulk-delete")
def delete_suppliers(ids: List[int], db: Session = Depends(get_db)):
    try:
        for supplier_id in ids:
            supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
            if supplier:
                db.delete(supplier)
        db.commit()
        return {"message": "Suppliers deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/items/", response_model=ItemResponse)
def create_item(item: ItemBase, db: Session = Depends(get_db)):
    try:
        db_item = models.Item(
            name=item.name,
            price=item.price,
            description=item.description  # description 필드를 비고로 사용
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/items/", response_model=List[ItemResponse])
def read_items(db: Session = Depends(get_db)):
    items = db.query(models.Item).all()
    return items

@app.delete("/items/bulk-delete")
def delete_items(ids: List[int], db: Session = Depends(get_db)):
    try:
        for item_id in ids:
            item = db.query(models.Item).filter(models.Item.id == item_id).first()
            if item:
                db.delete(item)
        db.commit()
        return {"message": "Items deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/units/", response_model=UnitResponse)
def create_unit(unit: UnitBase, db: Session = Depends(get_db)):
    db_unit = models.Unit(**unit.dict())
    try:
        db.add(db_unit)
        db.commit()
        db.refresh(db_unit)
        logger.info(f"Created unit: {db_unit}")
        return db_unit
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating unit: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/units/", response_model=List[UnitResponse])
def read_units(db: Session = Depends(get_db)):
    units = db.query(models.Unit).all()
    return units

@app.delete("/units/bulk-delete")
def delete_units(ids: List[int], db: Session = Depends(get_db)):
    try:
        for unit_id in ids:
            unit = db.query(models.Unit).filter(models.Unit.id == unit_id).first()
            if unit:
                db.delete(unit)
        db.commit()
        return {"message": "Units deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orders/", response_model=List[OrderResponse])
def read_orders(db: Session = Depends(get_db)):
    try:
        # 관련 데이터가 모두 존재하는 발주만 조회
        orders = db.query(models.Order).join(
            models.Supplier
        ).join(
            models.Item
        ).join(
            models.Unit
        ).options(
            joinedload(models.Order.supplier),
            joinedload(models.Order.item),
            joinedload(models.Order.unit)
        ).all()
        
        logger.info(f"Retrieved {len(orders)} orders")
        return orders
    except Exception as e:
        logger.error(f"Error retrieving orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/orders/", response_model=OrderResponse)
def create_order(order: OrderBase, db: Session = Depends(get_db)):
    try:
        db_order = models.Order(
            supplier_id=order.supplier_id,
            item_id=order.item_id,
            unit_id=order.unit_id,
            quantity=order.quantity,
            price=order.price,
            total=order.total,
            payment_cycle=order.payment_cycle,
            payment_method=order.payment_method,
            client=order.client,
            notes=order.notes,
            date=order.date
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        return db_order
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/orders/bulk-delete")
def delete_orders(ids: List[int], db: Session = Depends(get_db)):
    try:
        for order_id in ids:
            order = db.query(models.Order).filter(models.Order.id == order_id).first()
            if order:
                db.delete(order)
        db.commit()
        return {"message": "Orders deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
