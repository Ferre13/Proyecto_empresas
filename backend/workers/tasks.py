import os
from workers.celery_app import celery_app
from core.database import SessionLocal
from models.invoice import Invoice
from models.batch import Batch
from services.ai_extractor import extract_invoice_data_with_gemini
from services.file_router import route_file_and_extract_text
from services.math_validator import validate_invoice_math
import google.generativeai as genai
from core.config import settings

# Configurar genai para los workers
genai.configure(api_key=settings.GEMINI_API_KEY)

from datetime import datetime, timedelta

@celery_app.task(name="process_invoice_task", bind=True, max_retries=3)
def process_invoice_task(self, invoice_id: str, tenant_id: str):
    db = SessionLocal()
    try:
        invoice = db.query(Invoice).filter(
            Invoice.id == invoice_id, 
            Invoice.tenant_id == tenant_id
        ).first()
        
        if not invoice:
            return f"Invoice {invoice_id} not found"

        invoice.status = "PROCESSING"
        db.commit()

        # Pilar 1: Determinar si procesamos como texto plano (Excel/Word) o visual (PDF/Imágenes)
        mode, extracted_text = route_file_and_extract_text(invoice.temp_file_path)

        try:
            if mode == 'text' and extracted_text:
                result = extract_invoice_data_with_gemini(text_content=extracted_text)
            else:
                ext = invoice.original_filename.lower().split('.')[-1]
                if ext == 'pdf':
                    mime_type = "application/pdf"
                elif ext in ['jpg', 'jpeg', 'png', 'webp']:
                    mime_type = f"image/{ext if ext != 'jpg' else 'jpeg'}"
                else:
                    mime_type = "application/octet-stream"

                result = extract_invoice_data_with_gemini(file_path=invoice.temp_file_path, mime_type=mime_type)

            invoice.is_valid_invoice = result.get("is_valid_invoice", False)
            invoice.extracted_data = result
            
            # Validación Matemática
            is_math_valid, math_error = validate_invoice_math(result)
            
            if not invoice.is_valid_invoice or not is_math_valid:
                invoice.status = "REQUIRES_REVIEW"
            else:
                invoice.status = "VALIDATED"
                
            db.commit()
            check_batch_status(invoice.batch_id, db)
            return f"Invoice {invoice_id} processed"

        except Exception as e:
            print(f"Error procesando factura {invoice_id} (intento {self.request.retries + 1}/{self.max_retries}): {e}")
            if self.request.retries < self.max_retries:
                db.rollback()
                raise self.retry(exc=e, countdown=15)
            else:
                invoice.status = "FAILED"
                db.commit()
                check_batch_status(invoice.batch_id, db)
                return f"Invoice {invoice_id} failed after retries: {str(e)}"

    except Exception as exc:
        db.rollback()
        # Si fue relanzado por self.retry(), propagarlo a Celery
        raise exc
    finally:
        db.close()

def check_batch_status(batch_id: str, db):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch: return
    
    invoices = db.query(Invoice).filter(Invoice.batch_id == batch_id).all()
    statuses = [inv.status for inv in invoices]
    
    if any(s in ["PROCESSING", "PENDING"] for s in statuses):
        batch.status = "PROCESSING"
    elif any(s in ["REQUIRES_REVIEW", "FAILED"] for s in statuses):
        batch.status = "NEEDS_REVIEW"
    elif all(s == "VALIDATED" for s in statuses):
        batch.status = "COMPLETED"
    else:
        # Fallback
        batch.status = "COMPLETED"
        
    db.commit()

@celery_app.task(name="purge_old_files_task")
def purge_old_files_task():
    """
    Pilar 3 (Stateless / RGPD):
    Purga archivos temporales locales con más de 24 horas de antigüedad.
    """
    db = SessionLocal()
    try:
        threshold = datetime.utcnow() - timedelta(hours=24)
        old_invoices = db.query(Invoice).filter(
            Invoice.created_at < threshold,
            Invoice.temp_file_path.isnot(None)
        ).all()

        purged_count = 0
        for inv in old_invoices:
            if inv.temp_file_path and os.path.exists(inv.temp_file_path):
                try:
                    os.remove(inv.temp_file_path)
                    purged_count += 1
                except Exception as e:
                    print(f"Error eliminando archivo {inv.temp_file_path}: {e}")
            inv.temp_file_path = None
        
        db.commit()
        print(f"Purga RGPD: {purged_count} archivos físicos eliminados tras superar 24 horas.")
        return f"Purged {purged_count} files"
    finally:
        db.close()
