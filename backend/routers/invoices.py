from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os

from core.database import get_db
from core.security import get_current_tenant
from models.invoice import Invoice
from models.tenant import Tenant

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """
    Obtiene los datos JSON de una factura específica.
    Pilar 1: Filtra estrictamente por tenant_id.
    """
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.tenant_id == current_tenant.id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada o acceso denegado."
        )
    
    return invoice

@router.get("/{invoice_id}/file")
async def get_invoice_file(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """
    Sirve el archivo físico (PDF/Imagen) de forma segura.
    Pilar 1: Verifica que el archivo pertenece al tenant antes de enviarlo.
    """
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.tenant_id == current_tenant.id
    ).first()

    if not invoice or not invoice.temp_file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo no encontrado."
        )

    if not os.path.exists(invoice.temp_file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El archivo físico ha sido purgado o no existe."
        )

    # Determinamos el media_type básico
    media_type = "application/pdf" if invoice.original_filename.lower().endswith(".pdf") else "image/jpeg"

    return FileResponse(
        path=invoice.temp_file_path,
        media_type=media_type,
        filename=invoice.original_filename
    )

@router.put("/{invoice_id}")
async def update_invoice_data(
    invoice_id: str,
    updated_payload: dict,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """
    Permite al usuario corregir los datos (Triaje).
    Al guardar, el estado cambia a VALIDATED.
    """
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.tenant_id == current_tenant.id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada.")

    # Actualizamos el JSON canónico con las correcciones humanas
    invoice.extracted_data = updated_payload.get("extracted_data", invoice.extracted_data)
    invoice.status = updated_payload.get("status", "VALIDATED")
    
    db.commit()
    return {"message": "Factura actualizada y validada correctamente."}
