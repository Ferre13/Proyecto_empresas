import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user, get_current_tenant, require_active_subscription
from models.user import User
from models.tenant import Tenant
from models.batch import Batch
from models.invoice import Invoice
from workers.tasks import process_invoice_task

router = APIRouter(prefix="/upload", tags=["Upload"])

@router.get("/batches")
async def list_batches(
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """Pilar 1: Listar lotes del inquilino actual."""
    return db.query(Batch).filter(Batch.tenant_id == current_tenant.id).order_by(Batch.created_at.desc()).all()

@router.get("/batches/{batch_id}/invoices")
async def list_batch_invoices(
    batch_id: str,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """Pilar 1: Listar facturas de un lote específico."""
    return db.query(Invoice).filter(
        Invoice.batch_id == batch_id,
        Invoice.tenant_id == current_tenant.id
    ).all()

# Carpeta temporal para archivos (Pilar 3: Stateless)
UPLOAD_DIR = "/tmp/ap_automation_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", status_code=202)
async def upload_invoices(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(require_active_subscription) # Capa 3 de Seguridad
):
    """
    Endpoint para subir múltiples facturas. 
    Crea un Batch e Invoices en la DB y lanza tareas de Celery.
    """
    # 1. Crear el Batch (Lote)
    batch = Batch(
        tenant_id=current_tenant.id,
        user_id=current_user.id,
        filename=f"Upload_{len(files)}_files",
        status="PROCESSING"
    )
    db.add(batch)
    db.flush() # Para obtener el ID del batch

    # 2. Procesar cada archivo individualmente (Pilar 1: Aislamiento)
    for file in files:
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1]
        temp_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")

        # Guardar físicamente el archivo de forma temporal
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Crear registro de la factura
        invoice = Invoice(
            id=file_id,
            tenant_id=current_tenant.id,
            batch_id=batch.id,
            original_filename=file.filename,
            temp_file_path=temp_path,
            status="PENDING"
        )
        db.add(invoice)
        db.flush()

        # 3. Lanzar la tarea asíncrona de Celery (Pilar 2)
        # La tarea lleva el tenant_id para asegurar el aislamiento en el worker
        process_invoice_task.delay(invoice.id, current_tenant.id)

    db.commit()

    return {
        "message": "Archivos recibidos y en proceso.",
        "batch_id": batch.id,
        "count": len(files)
    }
