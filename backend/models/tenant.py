import uuid
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class Tenant(Base):
    """
    Entidad principal del sistema. Representa a una empresa cliente.
    """
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    
    # Capa 3: Seguridad de Pagos (Stripe)
    stripe_customer_id = Column(String, unique=True, index=True, nullable=True)
    subscription_active = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    batches = relationship("Batch", back_populates="tenant", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="tenant", cascade="all, delete-orphan")
    mappings = relationship("ExportMapping", back_populates="tenant", cascade="all, delete-orphan")
