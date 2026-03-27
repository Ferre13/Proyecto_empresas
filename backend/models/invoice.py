import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class Invoice(Base):
    """
    Representa un documento individual (PDF, Imagen, Word, Excel).
    1 Archivo = 1 Factura = 1 Llamada a la IA.
    """
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # AISLAMIENTO ABSOLUTO: Regla Innegociable 1
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=False, index=True)
    
    original_filename = Column(String, nullable=False)
    
    # Ruta física temporal (Pilar 3: Stateless/RGPD - se purgará tras exportar o expirar)
    temp_file_path = Column(String, nullable=True) 
    
    # Estado del procesamiento: PENDING, PROCESSING, REQUIRES_REVIEW, VALIDATED, EXPORTED, FAILED
    status = Column(String, default="PENDING", nullable=False)
    
    # Campo inyectado por Gemini para prevenir alucinaciones (Si es un menú, será False)
    is_valid_invoice = Column(Boolean, nullable=True)
    
    # Modelo Canónico (Agnosticismo de Salida - Pilar 4): JSON inmutable con los datos extraídos
    extracted_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    tenant = relationship("Tenant", back_populates="invoices")
    batch = relationship("Batch", back_populates="invoices")
