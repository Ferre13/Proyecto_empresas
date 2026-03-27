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

        mime_type = "application/pdf" if invoice.original_filename.lower().endswith('.pdf') else "image/jpeg"

        # Llamada a Gemini 2.5 Flash
        result = extract_invoice_data_with_gemini(invoice.temp_file_path, mime_type)

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

    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()

def check_batch_status(batch_id: str, db):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch: return
    total = db.query(Invoice).filter(Invoice.batch_id == batch_id).count()
    finished = db.query(Invoice).filter(
        Invoice.batch_id == batch_id, 
        Invoice.status.in_(["VALIDATED", "REQUIRES_REVIEW", "FAILED"])
    ).count()
    if total == finished:
        batch.status = "COMPLETED"
        db.commit()
