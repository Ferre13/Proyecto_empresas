import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class ExportMapping(Base):
    """
    Motor de Mapeo (Pilar 4): Traduce el Modelo Canónico JSON al formato exigido por el ERP.
    """
    __tablename__ = "export_mappings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # AISLAMIENTO: Regla Innegociable 1
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    
    erp_name = Column(String, nullable=False) # ej. "SAP", "Holded", "A3", "CustomCSV"
    
    # JSON que define cómo mapear: {"client_column_A": "canonical_field_X"}
    mapping_config = Column(JSON, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    tenant = relationship("Tenant", back_populates="mappings")
