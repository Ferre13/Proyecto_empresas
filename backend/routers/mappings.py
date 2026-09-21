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

@router.get("/")
async def get_mappings(
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """Obtiene las configuraciones de mapeo guardadas para el tenant."""
    mappings = db.query(ExportMapping).filter(
        ExportMapping.tenant_id == current_tenant.id
    ).all()
    return [{"erp_name": m.erp_name, "config": m.mapping_config} for m in mappings]

@router.post("/")
async def save_mapping(
    payload: dict,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """Guarda la configuración de mapeo del cliente."""
    erp_name = payload.get("erp_name", "Excel / CSV")
    if not erp_name:
        raise HTTPException(status_code=400, detail="El nombre de la configuración de mapeo es obligatorio.")

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

DEFAULT_CANONICAL_MAPPING = {
    "Nº Factura": "invoice_number",
    "Fecha Emisión": "issue_date",
    "Fecha Vencimiento": "due_date",
    "Nombre Proveedor": "supplier_name",
    "NIF/CIF Proveedor": "supplier_tax_id",
    "Nombre Cliente": "customer_name",
    "NIF/CIF Cliente": "customer_tax_id",
    "Base Imponible": "subtotal",
    "Importe IVA": "tax_amount",
    "Total Factura": "total_amount",
    "Divisa": "currency"
}

@router.get("/export/{batch_id}")
async def export_batch(
    batch_id: str,
    erp_name: str = "Excel / CSV",
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """
    Pilar 4: Genera y sirve el archivo de exportación para un lote.
    Si no hay mapeo personalizado, usa el mapeo estándar por defecto.
    """
    mapping = db.query(ExportMapping).filter(
        ExportMapping.tenant_id == current_tenant.id,
        ExportMapping.erp_name == erp_name
    ).first()

    if not mapping:
        mapping = db.query(ExportMapping).filter(
            ExportMapping.tenant_id == current_tenant.id
        ).first()

    mapping_config = mapping.mapping_config if (mapping and mapping.mapping_config) else DEFAULT_CANONICAL_MAPPING

    # Intentar obtener validadas primero
    invoices = db.query(Invoice).filter(
        Invoice.batch_id == batch_id,
        Invoice.tenant_id == current_tenant.id,
        Invoice.status == "VALIDATED"
    ).all()

    # Si no hay validadas expresamente, obtener todas las que tengan datos extraídos
    if not invoices:
        invoices = db.query(Invoice).filter(
            Invoice.batch_id == batch_id,
            Invoice.tenant_id == current_tenant.id,
            Invoice.extracted_data.isnot(None)
        ).all()

    if not invoices:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No hay facturas procesadas con datos en este lote para exportar."
        )

    excel_file = generate_erp_export(invoices, mapping_config, format="xlsx")

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=export_{batch_id}.xlsx"}
    )
