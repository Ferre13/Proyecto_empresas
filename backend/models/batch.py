import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class Batch(Base):
    """
    Lote de facturas subidas por un usuario (ej. un archivo ZIP o varios PDFs a la vez).
    """
    __tablename__ = "batches"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # AISLAMIENTO: Regla Innegociable 1
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    filename = Column(String, nullable=False) # Nombre del archivo original (ej. facturas_marzo.zip)
    status = Column(String, default="PENDING", nullable=False) # PENDING, PROCESSING, COMPLETED, FAILED
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    tenant = relationship("Tenant", back_populates="batches")
    user = relationship("User", back_populates="batches")
    invoices = relationship("Invoice", back_populates="batch", cascade="all, delete-orphan")
