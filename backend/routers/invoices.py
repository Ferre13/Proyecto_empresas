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

def sync_batch_status(batch_id: str, db: Session):
    """
    Sincroniza el estado del lote basado en el estado de sus facturas.
    Si todas están VALIDATED, el lote pasa a COMPLETED.
    Si hay alguna en REQUIRES_REVIEW o FAILED, pasa a NEEDS_REVIEW.
    """
    from models.batch import Batch
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        return

    invoices = db.query(Invoice).filter(Invoice.batch_id == batch_id).all()
    statuses = [inv.status for inv in invoices]

    if any(s in ["PROCESSING", "PENDING"] for s in statuses):
        batch.status = "PROCESSING"
    elif any(s in ["REQUIRES_REVIEW", "FAILED"] for s in statuses):
        batch.status = "NEEDS_REVIEW"
    elif all(s == "VALIDATED" for s in statuses):
        batch.status = "COMPLETED"
    else:
        # Fallback (ej. sin facturas o estado inesperado)
        batch.status = "COMPLETED"
    
    db.commit()

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
    extracted_data = updated_payload.get("extracted_data", invoice.extracted_data)
    invoice.extracted_data = extracted_data
    
    # Sincronizamos la columna de nivel superior is_valid_invoice
    if extracted_data and "is_valid_invoice" in extracted_data:
        invoice.is_valid_invoice = extracted_data["is_valid_invoice"]
        
    invoice.status = updated_payload.get("status", "VALIDATED")
    
    db.commit()
    
    # IMPORTANTE: Sincronizar el estado del lote
    sync_batch_status(invoice.batch_id, db)
    
    return {"message": "Factura actualizada y validada correctamente.", "new_batch_status": invoice.batch.status}

@router.post("/{invoice_id}/retry")
async def retry_invoice_processing(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """
    Permite re-enviar una factura a Gemini si falló o se quedó estancada.
    """
    from workers.tasks import process_invoice_task

    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.tenant_id == current_tenant.id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada.")

    # Resetear estado a PENDING para que el worker la coja de nuevo
    invoice.status = "PENDING"
    db.commit()

    # IMPORTANTE: Sincronizar el estado del lote para que vuelva a PROCESSING
    sync_batch_status(invoice.batch_id, db)

    # Lanzar la tarea de nuevo
    process_invoice_task.delay(invoice.id, current_tenant.id)
    
    return {"message": "Re-procesamiento iniciado."}
