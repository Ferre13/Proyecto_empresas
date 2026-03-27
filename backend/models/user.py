import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class User(Base):
    """
    Usuarios del sistema. El ID provendrá del JWT de Supabase (Capa 2: Seguridad).
    El sistema no almacena contraseñas.
    """
    __tablename__ = "users"

    # El ID es el 'sub' del JWT de Supabase
    id = Column(String, primary_key=True)
    
    # AISLAMIENTO: Regla Innegociable 1
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="user", nullable=False) # 'admin', 'user'
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    tenant = relationship("Tenant", back_populates="users")
    batches = relationship("Batch", back_populates="user")
