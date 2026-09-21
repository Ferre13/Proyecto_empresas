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

        # Determinar mime_type
        ext = invoice.original_filename.lower().split('.')[-1]
        if ext == 'pdf':
            mime_type = "application/pdf"
        elif ext in ['jpg', 'jpeg', 'png', 'webp']:
            mime_type = f"image/{ext if ext != 'jpg' else 'jpeg'}"
        else:
            mime_type = "application/octet-stream" # Fallback

        # Llamada a Gemini 2.5 Flash
        try:
            result = extract_invoice_data_with_gemini(invoice.temp_file_path, mime_type)
            invoice.is_valid_invoice = result.get("is_valid_invoice", False)
            invoice.extracted_data = result
            
            # Validación Matemática
            is_math_valid, math_error = validate_invoice_math(result)
            
            if not invoice.is_valid_invoice or not is_math_valid:
                invoice.status = "REQUIRES_REVIEW"
            else:
                invoice.status = "VALIDATED"
        except Exception as e:
            print(f"Error extracting data for {invoice_id}: {e}")
            invoice.status = "FAILED"
            
        db.commit()
        check_batch_status(invoice.batch_id, db)
        return f"Invoice {invoice_id} processed"

    except Exception as exc:
        db.rollback()
        if self.request.retries >= self.max_retries:
            # Si ya se agotaron los reintentos, marcar como fallido definitivamente
            invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
            if invoice:
                invoice.status = "FAILED"
                db.commit()
                check_batch_status(invoice.batch_id, db)
        raise self.retry(exc=exc, countdown=60)
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
