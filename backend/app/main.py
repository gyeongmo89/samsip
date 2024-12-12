from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine, get_db, Base, SessionLocal
from pydantic import BaseModel
from typing import Optional, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables

    
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
    client: str
    notes: Optional[str] = None

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
        # Create new supplier
        db_supplier = models.Supplier(
            name=supplier.name,
            contact=supplier.contact,
            address=supplier.address
        )
        db.add(db_supplier)
        db.commit()
        db.refresh(db_supplier)
        
        print(f"Created supplier: {db_supplier.id}, {db_supplier.name}")
        return db_supplier
    except Exception as e:
        db.rollback()
        print(f"Error creating supplier: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/suppliers/", response_model=List[SupplierResponse])
def read_suppliers(db: Session = Depends(get_db)):
    suppliers = db.query(models.Supplier).all()
    print(f"Found suppliers: {[f'{s.id}: {s.name}' for s in suppliers]}")
    return suppliers

@app.post("/items/", response_model=ItemResponse)
def create_item(item: ItemBase, db: Session = Depends(get_db)):
    db_item = models.Item(**item.dict())
    try:
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        logger.info(f"Created item: {db_item}")
        return db_item
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating item: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/items/", response_model=List[ItemResponse])
def read_items(db: Session = Depends(get_db)):
    items = db.query(models.Item).all()
    return [ItemResponse.from_orm(item) for item in items]

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
    return [UnitResponse.from_orm(unit) for unit in units]

@app.post("/orders/", response_model=OrderResponse)
def create_order(order: OrderBase, db: Session = Depends(get_db)):
    # Check if supplier, item, and unit exist
    supplier = db.query(models.Supplier).filter(models.Supplier.id == order.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    item = db.query(models.Item).filter(models.Item.id == order.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    unit = db.query(models.Unit).filter(models.Unit.id == order.unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    db_order = models.Order(**order.dict())
    try:
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        logger.info(f"Created order: {db_order}")
        return db_order
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating order: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/orders/", response_model=List[OrderResponse])
def read_orders(db: Session = Depends(get_db)):
    orders = db.query(models.Order).all()
    logger.info(f"Retrieved {len(orders)} orders")
    return orders
