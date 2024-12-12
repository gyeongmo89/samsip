from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    contact = Column(String, nullable=True)
    address = Column(String, nullable=True)
    
    orders = relationship("Order", back_populates="supplier")

    def __repr__(self):
        return f"<Supplier(id={self.id}, name='{self.name}')>"

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    
    orders = relationship("Order", back_populates="item")

    def __repr__(self):
        return f"<Item(id={self.id}, name='{self.name}')>"

class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    orders = relationship("Order", back_populates="unit")

    def __repr__(self):
        return f"<Unit(id={self.id}, name='{self.name}')>"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    item_id = Column(Integer, ForeignKey("items.id"))
    unit_id = Column(Integer, ForeignKey("units.id"))
    quantity = Column(Float)
    price = Column(Float)
    total = Column(Float)
    payment_cycle = Column(String)
    client = Column(String)
    notes = Column(String, nullable=True)
    
    supplier = relationship("Supplier", back_populates="orders")
    item = relationship("Item", back_populates="orders")
    unit = relationship("Unit", back_populates="orders")

    def __repr__(self):
        return f"<Order(id={self.id}, supplier_id={self.supplier_id}, item_id={self.item_id})>"
