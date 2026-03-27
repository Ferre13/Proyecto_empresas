from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import date

class InvoiceLineItem(BaseModel):
    """Línea de detalle de la factura."""
    description: str = Field(description="Descripción del producto o servicio.")
    quantity: float = Field(description="Cantidad adquirida.")
    unit_price: float = Field(description="Precio unitario sin impuestos.")
    total_amount: float = Field(description="Precio total de la línea.")

class CanonicalInvoiceSchema(BaseModel):
    """
    Modelo Canónico (Pilar 4). Esquema simplificado para compatibilidad con Gemini.
    """
    is_valid_invoice: bool = Field(
        description="TRUE si es una factura/ticket válido, FALSE si no lo es."
    )
    
    invoice_number: Optional[str] = Field(None, description="Número de la factura.")
    issue_date: Optional[date] = Field(None, description="Fecha de emisión (YYYY-MM-DD).")
    due_date: Optional[date] = Field(None, description="Fecha de vencimiento (YYYY-MM-DD).")
    
    supplier_name: Optional[str] = Field(None, description="Nombre del emisor.")
    supplier_tax_id: Optional[str] = Field(None, description="ID Fiscal del emisor.")
    
    customer_name: Optional[str] = Field(None, description="Nombre del receptor.")
    customer_tax_id: Optional[str] = Field(None, description="ID Fiscal del receptor.")
    
    subtotal: Optional[float] = Field(None, description="Base imponible.")
    tax_amount: Optional[float] = Field(None, description="Total impuestos.")
    total_amount: Optional[float] = Field(None, description="Total a pagar.")
    currency: Optional[str] = Field(None, description="Moneda (EUR, USD, etc).")
    
    line_items: List[InvoiceLineItem] = Field(description="Lista de productos/servicios.")
