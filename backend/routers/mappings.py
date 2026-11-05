from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
import pandas as pd
import io

from core.database import get_db
from core.security import (
    get_current_tenant,
    get_current_user_token_payload,
    sync_user_metadata_to_supabase,
)
from models.tenant import Tenant
from models.mapping import ExportMapping
from models.invoice import Invoice
from services.exporter import generate_erp_export

router = APIRouter(prefix="/mappings", tags=["Mappings"])

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
    "Retención IRPF": "retention_amount",
    "Total Factura": "total_amount",
    "Divisa": "currency",
}

PRECONFIGURED_ERP_TEMPLATES = [
    {
        "id": "quickbooks",
        "erp_name": "QuickBooks Online",
        "region": "US / UK / Global",
        "badge": "🇺🇸 🇬🇧",
        "description": "Standard QuickBooks Online AP Bill & Invoice import format",
        "config": {
            "InvoiceNo": "invoice_number",
            "InvoiceDate": "issue_date",
            "DueDate": "due_date",
            "Vendor": "supplier_name",
            "VendorTaxId": "supplier_tax_id",
            "Customer": "customer_name",
            "NetAmount": "subtotal",
            "TaxAmount": "tax_amount",
            "TotalAmount": "total_amount",
            "CurrencyCode": "currency",
        },
    },
    {
        "id": "xero",
        "erp_name": "Xero",
        "region": "UK / US / AU",
        "badge": "🇬🇧 🇺🇸",
        "description": "Official Xero Bills & Purchases CSV/Excel import schema",
        "config": {
            "*ContactName": "supplier_name",
            "ContactTaxNumber": "supplier_tax_id",
            "*InvoiceNumber": "invoice_number",
            "*InvoiceDate": "issue_date",
            "*DueDate": "due_date",
            "SubTotal": "subtotal",
            "TotalTax": "tax_amount",
            "*Total": "total_amount",
            "Currency": "currency",
        },
    },
    {
        "id": "sap_b1",
        "erp_name": "SAP Business One",
        "region": "Global Enterprise",
        "badge": "🌐",
        "description": "SAP B1 / S/4HANA Data Transfer Workbench (OPCH / PCH1) headers",
        "config": {
            "DocNum": "invoice_number",
            "DocDate": "issue_date",
            "DocDueDate": "due_date",
            "CardName": "supplier_name",
            "LicTradNum": "supplier_tax_id",
            "DocTotalNet": "subtotal",
            "VatSum": "tax_amount",
            "WTAmnt": "retention_amount",
            "DocTotal": "total_amount",
            "DocCur": "currency",
        },
    },
    {
        "id": "sage",
        "erp_name": "Sage 50 / Intacct",
        "region": "UK / US / EU",
        "badge": "🇬🇧 🇪🇺",
        "description": "Sage 50cloud & Sage Intacct Purchase Ledger batch import",
        "config": {
            "Reference": "invoice_number",
            "Date": "issue_date",
            "Due_Date": "due_date",
            "Account_Name": "supplier_name",
            "VAT_Registration": "supplier_tax_id",
            "Net_Amount": "subtotal",
            "Tax_Amount": "tax_amount",
            "Gross_Amount": "total_amount",
            "Currency_Code": "currency",
        },
    },
    {
        "id": "netsuite",
        "erp_name": "Oracle NetSuite",
        "region": "US / Global",
        "badge": "🇺🇸 🌐",
        "description": "NetSuite Vendor Bill CSV Import Assistant standard mapping",
        "config": {
            "ExternalID": "invoice_number",
            "TranDate": "issue_date",
            "DueDate": "due_date",
            "VendorName": "supplier_name",
            "VendorTaxRegNum": "supplier_tax_id",
            "CustomerName": "customer_name",
            "SubtotalAmount": "subtotal",
            "TaxTotal": "tax_amount",
            "WithholdingTax": "retention_amount",
            "Total": "total_amount",
            "Currency": "currency",
        },
    },
    {
        "id": "holded",
        "erp_name": "Holded",
        "region": "ES / EU",
        "badge": "🇪🇸 🇪🇺",
        "description": "Plantilla oficial de importación de facturas de compra para Holded",
        "config": {
            "NumFactura": "invoice_number",
            "FechaEmision": "issue_date",
            "FechaVencimiento": "due_date",
            "ContactoNombre": "supplier_name",
            "ContactoNIF": "supplier_tax_id",
            "Subtotal": "subtotal",
            "IVA": "tax_amount",
            "RetencionIRPF": "retention_amount",
            "Total": "total_amount",
            "Moneda": "currency",
        },
    },
    {
        "id": "a3_wolters",
        "erp_name": "A3 / Wolters Kluwer",
        "region": "ES Asesorías",
        "badge": "🇪🇸",
        "description": "Formato de enlace contable para A3ASESOR / A3ECO / A3CON",
        "config": {
            "N_FACTURA": "invoice_number",
            "FECHA_EXP": "issue_date",
            "FECHA_VTO": "due_date",
            "NOMBRE_PROV": "supplier_name",
            "NIF_PROVEEDOR": "supplier_tax_id",
            "BASE_IMPONIBLE": "subtotal",
            "CUOTA_IVA": "tax_amount",
            "CUOTA_IRPF": "retention_amount",
            "TOTAL_FACTURA": "total_amount",
            "DIVISA": "currency",
        },
    },
]


@router.get("/templates")
async def get_erp_templates():
    """Devuelve las plantillas ERP preconfiguradas (UK, US, EU, ES)."""
    return PRECONFIGURED_ERP_TEMPLATES


@router.post("/detect-headers")
async def detect_headers(file: UploadFile = File(...)):
    """
    Recibe un Excel de muestra y devuelve los nombres de las columnas detectadas.
    """
    try:
        contents = await file.read()
        ext = file.filename.split(".")[-1].lower()

        # Usamos io.BytesIO para manejar el archivo en memoria sin guardarlo en disco (Pilar 3)
        if ext == "csv":
            df = pd.read_csv(io.BytesIO(contents), nrows=0)
        elif ext in ["xlsx"]:
            df = pd.read_excel(io.BytesIO(contents), nrows=0, engine="openpyxl")
        elif ext in ["xls"]:
            try:
                df = pd.read_excel(io.BytesIO(contents), nrows=0)
            except Exception:
                raise HTTPException(
                    status_code=400,
                    detail="Los archivos .xls antiguos de Excel 97-2003 no son compatibles. Por favor, guárdalo como .xlsx o .csv",
                )
        else:
            raise HTTPException(
                status_code=400,
                detail="Formato de archivo no soportado. Usa .csv o .xlsx",
            )

        return {"columns": df.columns.tolist()}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer el archivo: {str(e)}")


@router.get("/")
async def get_mappings(
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant),
    token_payload: dict = Depends(get_current_user_token_payload),
):
    """
    Obtiene las configuraciones de mapeo guardadas para el tenant.
    Si la tabla local está vacía pero el usuario tiene mapeos guardados en su perfil
    de Supabase Cloud (user_metadata.erp_mappings), los restaura automáticamente.
    """
    mappings = (
        db.query(ExportMapping)
        .filter(ExportMapping.tenant_id == current_tenant.id)
        .order_by(ExportMapping.updated_at.desc())
        .all()
    )

    if not mappings:
        user_meta = token_payload.get("user_metadata") or {}
        cloud_mappings = user_meta.get("erp_mappings")
        if isinstance(cloud_mappings, list) and len(cloud_mappings) > 0:
            for item in cloud_mappings:
                erp_name = item.get("erp_name")
                config = item.get("config")
                if erp_name and isinstance(config, dict):
                    restored = ExportMapping(
                        tenant_id=current_tenant.id,
                        erp_name=erp_name,
                        mapping_config=config,
                    )
                    db.add(restored)
            db.commit()
            mappings = (
                db.query(ExportMapping)
                .filter(ExportMapping.tenant_id == current_tenant.id)
                .order_by(ExportMapping.updated_at.desc())
                .all()
            )

    return [{"id": m.id, "erp_name": m.erp_name, "config": m.mapping_config} for m in mappings]


@router.post("/")
async def save_mapping(
    payload: dict,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant),
    token_payload: dict = Depends(get_current_user_token_payload),
):
    """
    Guarda la configuración de mapeo del cliente en PostgreSQL y la sincroniza
    en Supabase Cloud (user_metadata) para persistencia multi-dispositivo.
    """
    erp_name = (payload.get("erp_name") or "").strip()
    if not erp_name:
        raise HTTPException(
            status_code=400, detail="El nombre de la configuración de mapeo es obligatorio."
        )

    config = payload.get("config")
    if not isinstance(config, dict) or len(config) == 0:
        raise HTTPException(
            status_code=400, detail="La configuración de columnas no puede estar vacía."
        )

    mapping = (
        db.query(ExportMapping)
        .filter(
            ExportMapping.tenant_id == current_tenant.id,
            ExportMapping.erp_name == erp_name,
        )
        .first()
    )

    if not mapping:
        mapping = ExportMapping(tenant_id=current_tenant.id, erp_name=erp_name)
        db.add(mapping)

    mapping.mapping_config = config
    mapping.updated_at = func.now()
    db.commit()

    # Sincronizar con Supabase Cloud (user_metadata)
    all_mappings = (
        db.query(ExportMapping)
        .filter(ExportMapping.tenant_id == current_tenant.id)
        .order_by(ExportMapping.updated_at.desc())
        .all()
    )
    serialized = [{"erp_name": m.erp_name, "config": m.mapping_config} for m in all_mappings]
    raw_token = token_payload.get("raw_token")
    if raw_token:
        sync_user_metadata_to_supabase(
            raw_token,
            {"erp_mappings": serialized, "active_erp": erp_name},
        )

    return {
        "message": "Configuración de mapeo guardada exitosamente.",
        "erp_name": erp_name,
        "mappings": serialized,
    }


@router.delete("/{erp_name}")
async def delete_mapping(
    erp_name: str,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant),
    token_payload: dict = Depends(get_current_user_token_payload),
):
    """Elimina una configuración de mapeo guardada del tenant y sincroniza con Supabase."""
    mapping = (
        db.query(ExportMapping)
        .filter(
            ExportMapping.tenant_id == current_tenant.id,
            ExportMapping.erp_name == erp_name,
        )
        .first()
    )
    if not mapping:
        raise HTTPException(status_code=404, detail="Configuración de mapeo no encontrada.")

    db.delete(mapping)
    db.commit()

    all_mappings = (
        db.query(ExportMapping)
        .filter(ExportMapping.tenant_id == current_tenant.id)
        .order_by(ExportMapping.updated_at.desc())
        .all()
    )
    serialized = [{"erp_name": m.erp_name, "config": m.mapping_config} for m in all_mappings]
    raw_token = token_payload.get("raw_token")
    if raw_token:
        sync_user_metadata_to_supabase(raw_token, {"erp_mappings": serialized})

    return {"message": "Configuración eliminada.", "mappings": serialized}


@router.get("/export/{batch_id}")
async def export_batch(
    batch_id: str,
    erp_name: str = "Excel / CSV",
    format: str = "xlsx",
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """
    Pilar 4: Genera y sirve el archivo de exportación para un lote.
    Soporta configuraciones guardadas por el usuario, plantillas ERP oficiales
    preconfiguradas o el mapeo canónico estándar por defecto.
    """
    mapping = (
        db.query(ExportMapping)
        .filter(
            ExportMapping.tenant_id == current_tenant.id,
            ExportMapping.erp_name == erp_name,
        )
        .first()
    )

    mapping_config = None
    if mapping and mapping.mapping_config:
        mapping_config = mapping.mapping_config
    else:
        # Comprobar si coincide con una plantilla oficial preconfigurada
        preset = next(
            (
                t
                for t in PRECONFIGURED_ERP_TEMPLATES
                if t["erp_name"].lower() == erp_name.lower() or t["id"].lower() == erp_name.lower()
            ),
            None,
        )
        if preset:
            mapping_config = preset["config"]
        else:
            # Fallback al mapeo más reciente del tenant
            latest = (
                db.query(ExportMapping)
                .filter(ExportMapping.tenant_id == current_tenant.id)
                .order_by(ExportMapping.updated_at.desc())
                .first()
            )
            mapping_config = (
                latest.mapping_config
                if (latest and latest.mapping_config)
                else DEFAULT_CANONICAL_MAPPING
            )

    # Intentar obtener validadas primero
    invoices = (
        db.query(Invoice)
        .filter(
            Invoice.batch_id == batch_id,
            Invoice.tenant_id == current_tenant.id,
            Invoice.status == "VALIDATED",
        )
        .all()
    )

    # Si no hay validadas expresamente, obtener todas las que tengan datos extraídos
    if not invoices:
        invoices = (
            db.query(Invoice)
            .filter(
                Invoice.batch_id == batch_id,
                Invoice.tenant_id == current_tenant.id,
                Invoice.extracted_data.isnot(None),
            )
            .all()
        )

    if not invoices:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay facturas procesadas con datos en este lote para exportar.",
        )

    export_fmt = "csv" if format.lower() == "csv" else "xlsx"
    file_buffer = generate_erp_export(invoices, mapping_config, format=export_fmt)

    if export_fmt == "csv":
        return StreamingResponse(
            file_buffer,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=export_{batch_id}.csv"},
        )

    return StreamingResponse(
        file_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=export_{batch_id}.xlsx"},
    )
