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
from fastapi import FastAPI, HTTPException, status, Depends, UploadFile, File
from datetime import datetime
import io
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter

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

def get_float_value(value):
    if not value:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        if value.startswith('='):  # 엑셀 수식인 경우
            return 0.0  # 기본값 반환 또는 다른 처리 로직 추가
        try:
            return float(value.replace(',', ''))  # 천단위 구분자 제거
        except ValueError:
            return 0.0
    return 0.0

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
    suppliers = db.query(models.Supplier).filter(models.Supplier.is_deleted == False).all()
    return suppliers

@app.delete("/suppliers/bulk-delete")
def bulk_delete_suppliers(supplier_ids: List[int], db: Session = Depends(get_db)):
    try:
        suppliers = db.query(models.Supplier).filter(models.Supplier.id.in_(supplier_ids)).all()
        for supplier in suppliers:
            supplier.is_deleted = True
        db.commit()
        return {"message": f"Successfully deleted {len(suppliers)} suppliers"}
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
    items = db.query(models.Item).filter(models.Item.is_deleted == False).all()
    return items

@app.delete("/items/bulk-delete")
def bulk_delete_items(item_ids: List[int], db: Session = Depends(get_db)):
    try:
        items = db.query(models.Item).filter(models.Item.id.in_(item_ids)).all()
        for item in items:
            item.is_deleted = True
        db.commit()
        return {"message": f"Successfully deleted {len(items)} items"}
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
    units = db.query(models.Unit).filter(models.Unit.is_deleted == False).all()
    return units

@app.delete("/units/bulk-delete")
def bulk_delete_units(unit_ids: List[int], db: Session = Depends(get_db)):
    try:
        units = db.query(models.Unit).filter(models.Unit.id.in_(unit_ids)).all()
        for unit in units:
            unit.is_deleted = True
        db.commit()
        return {"message": f"Successfully deleted {len(units)} units"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orders/", response_model=List[OrderResponse])
def read_orders(db: Session = Depends(get_db)):
    try:
        orders = db.query(models.Order).options(
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

@app.post("/orders/upload")
async def upload_orders(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Only .xlsx files are allowed")

    try:
        contents = await file.read()
        wb = load_workbook(filename=io.BytesIO(contents), data_only=True)  # data_only=True로 수식 대신 값을 가져옴
        ws = wb.active
        
        orders = []
        for row in ws.iter_rows(min_row=2, values_only=True):
            if not any(row):  # 빈 행 건너뛰기
                continue
                
            try:
                order_date = datetime.strptime(str(row[0]), '%Y-%m-%d').date()
            except:
                order_date = datetime.now().date()

            # 구입처 찾기 또는 생성
            supplier = db.query(models.Supplier).filter(models.Supplier.name == row[1]).first()
            if not supplier:
                supplier = models.Supplier(name=row[1], contact=row[9])
                db.add(supplier)
                db.flush()

            # 품목 찾기 또는 생성
            item = db.query(models.Item).filter(models.Item.name == row[2]).first()
            if not item:
                item = models.Item(name=row[2], price=get_float_value(row[3]))
                db.add(item)
                db.flush()

            # 단위 찾기 또는 생성
            unit = db.query(models.Unit).filter(models.Unit.name == row[4]).first()
            if not unit:
                unit = models.Unit(name=row[4])
                db.add(unit)
                db.flush()

            # 발주 데이터 생성
            order = models.Order(
                date=order_date,
                supplier_id=supplier.id,
                item_id=item.id,
                unit_id=unit.id,
                price=get_float_value(row[3]),
                quantity=get_float_value(row[5]),
                total=get_float_value(row[6]),
                payment_cycle=str(row[7] or ''),
                payment_method=str(row[8] or ''),
                client=str(row[9] or ''),
                notes=str(row[10] or '')
            )
            orders.append(order)

        db.add_all(orders)
        db.commit()

        return {"message": f"Successfully uploaded {len(orders)} orders"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
