import os
import uuid
import shutil
import zipfile
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

@router.delete("/batches/{batch_id}")
async def delete_batch(
    batch_id: str,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """
    Elimina un lote y todas sus facturas asociadas.
    Pilar 3: Limpieza física de archivos del disco.
    """
    batch = db.query(Batch).filter(
        Batch.id == batch_id,
        Batch.tenant_id == current_tenant.id
    ).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Lote no encontrado.")

    # 1. Eliminar archivos físicos de todas las facturas del lote (con filtro de tenant)
    invoices = db.query(Invoice).filter(
        Invoice.batch_id == batch_id,
        Invoice.tenant_id == current_tenant.id
    ).all()
    for inv in invoices:
        if inv.temp_file_path and os.path.exists(inv.temp_file_path):
            try:
                os.remove(inv.temp_file_path)
            except Exception as e:
                print(f"Error eliminando archivo {inv.temp_file_path}: {e}")

    # 2. Eliminar registro del batch (esto borrará las invoices en cascada por el modelo)
    db.delete(batch)
    db.commit()

    return {"message": "Lote y archivos eliminados correctamente."}

# Carpeta temporal para archivos (Pilar 3: Stateless)
UPLOAD_DIR = "/tmp/ap_automation_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_and_create_invoice(file_obj, filename, batch_id, tenant_id, db: Session) -> Invoice:
    """Helper para guardar archivo y crear registro de factura en DB."""
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(filename)[1]
    temp_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")

    # Guardar físicamente
    if hasattr(file_obj, 'read'): # UploadFile
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file_obj, buffer)
    else: # Path o similar (para archivos extraídos)
        shutil.copy2(file_obj, temp_path)

    # Crear registro
    invoice = Invoice(
        id=file_id,
        tenant_id=tenant_id,
        batch_id=batch_id,
        original_filename=filename,
        temp_file_path=temp_path,
        status="PENDING"
    )
    db.add(invoice)
    db.flush()
    return invoice

@router.post("/", status_code=202)
async def upload_invoices(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(require_active_subscription)
):
    # 1. Crear el Batch
    batch = Batch(
        tenant_id=current_tenant.id,
        user_id=current_user.id,
        filename=f"Upload_{len(files)}_items",
        status="PROCESSING"
    )
    db.add(batch)
    db.flush()

    created_invoices = []

    for file in files:
        if file.filename.lower().endswith('.zip'):
            # Procesar ZIP de forma segura (Prevención Zip Slip)
            zip_id = str(uuid.uuid4())
            extract_path = os.path.join(UPLOAD_DIR, zip_id)
            os.makedirs(extract_path, exist_ok=True)
            
            # Guardar zip temporalmente para extraer
            temp_zip = os.path.join(UPLOAD_DIR, f"{zip_id}.zip")
            with open(temp_zip, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            try:
                real_extract_dir = os.path.realpath(extract_path)
                with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
                    # Validar todos los miembros antes de extraer
                    for member in zip_ref.namelist():
                        member_real_path = os.path.realpath(os.path.join(real_extract_dir, member))
                        if not member_real_path.startswith(real_extract_dir + os.sep) and member_real_path != real_extract_dir:
                            raise HTTPException(
                                status_code=400, 
                                detail="Archivo ZIP sospechoso detectado (intento de directory traversal)."
                            )
                    
                    zip_ref.extractall(extract_path)
                    
                    for root, _, filenames in os.walk(extract_path):
                        for filename in filenames:
                            if filename.startswith('__MACOSX') or filename.startswith('.'):
                                continue
                            file_path = os.path.join(root, filename)
                            inv = save_and_create_invoice(file_path, filename, batch.id, current_tenant.id, db)
                            created_invoices.append(inv.id)
            finally:
                if os.path.exists(temp_zip):
                    os.remove(temp_zip)
                # Pilar 3: Limpiar el directorio temporal descomprimido
                if os.path.exists(extract_path):
                    shutil.rmtree(extract_path, ignore_errors=True)
        else:
            # Archivo normal
            inv = save_and_create_invoice(file.file, file.filename, batch.id, current_tenant.id, db)
            created_invoices.append(inv.id)

    # CRÍTICO: Commit antes de lanzar tareas a Celery para evitar Race Conditions
    db.commit()

    # Lanzar tareas Celery una vez que la DB ya ha persistido los registros
    for invoice_id in created_invoices:
        process_invoice_task.delay(invoice_id, current_tenant.id)

    return {
        "message": "Archivos recibidos y en proceso.",
        "batch_id": batch.id
    }
