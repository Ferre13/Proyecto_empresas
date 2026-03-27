from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
import io

from core.database import get_db
from core.security import get_current_tenant
from models.tenant import Tenant
from models.mapping import ExportMapping
from models.invoice import Invoice
from services.exporter import generate_erp_export

router = APIRouter(prefix="/mappings", tags=["Mappings"])

@router.post("/detect-headers")
async def detect_headers(file: UploadFile = File(...)):
    """
    Recibe un Excel de muestra y devuelve los nombres de las columnas detectadas.
    """
    try:
        contents = await file.read()
        ext = file.filename.split('.')[-1].lower()
        
        # Usamos io.BytesIO para manejar el archivo en memoria sin guardarlo en disco (Pilar 3)
        if ext == 'csv':
            df = pd.read_csv(io.BytesIO(contents), nrows=0)
        elif ext in ['xlsx', 'xls']:
            # Forzamos openpyxl para leer archivos Excel modernos
            df = pd.read_excel(io.BytesIO(contents), nrows=0, engine='openpyxl')
        else:
            raise HTTPException(status_code=400, detail="Formato de archivo no soportado. Usa .csv o .xlsx")
            
        return {"columns": df.columns.tolist()}
    except Exception as e:
        # Devolvemos el error real para depuración
        raise HTTPException(status_code=400, detail=f"Error al leer el archivo: {str(e)}")

@router.post("/")
async def save_mapping(
    payload: dict,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """Guarda la configuración de mapeo del cliente."""
    erp_name = payload.get("erp_name")
    if not erp_name:
        raise HTTPException(status_code=400, detail="Nombre del ERP es obligatorio.")

    mapping = db.query(ExportMapping).filter(
        ExportMapping.tenant_id == current_tenant.id,
        ExportMapping.erp_name == erp_name
    ).first()

    if not mapping:
        mapping = ExportMapping(tenant_id=current_tenant.id, erp_name=erp_name)
        db.add(mapping)

    mapping.mapping_config = payload.get("config")
    db.commit()
    return {"message": "Configuración de mapeo guardada exitosamente."}

@router.get("/export/{batch_id}")
async def export_batch(
    batch_id: str,
    erp_name: str,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """
    Pilar 4: Genera y sirve el archivo de exportación para un lote.
    """
    mapping = db.query(ExportMapping).filter(
        ExportMapping.tenant_id == current_tenant.id,
        ExportMapping.erp_name == erp_name
    ).first()

    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"No se ha encontrado una configuración de mapeo para {erp_name}"
        )

    invoices = db.query(Invoice).filter(
        Invoice.batch_id == batch_id,
        Invoice.tenant_id == current_tenant.id,
        Invoice.status == "VALIDATED"
    ).all()

    if not invoices:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No hay facturas validadas en este lote para exportar."
        )

    excel_file = generate_erp_export(invoices, mapping.mapping_config, format="xlsx")

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=export_{erp_name}_{batch_id}.xlsx"}
    )
