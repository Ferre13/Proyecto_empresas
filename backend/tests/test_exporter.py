import pytest
import io
import pandas as pd
from unittest.mock import MagicMock
from services.exporter import generate_erp_export

def test_generate_erp_export_xlsx():
    inv1 = MagicMock()
    inv1.extracted_data = {
        "invoice_number": "F-001",
        "supplier_name": "Proveedor A",
        "total_amount": 150.0,
        "line_items": [{"description": "Servicio", "total_amount": 150.0}]
    }
    
    inv2 = MagicMock()
    inv2.extracted_data = {
        "invoice_number": "F-002",
        "supplier_name": "Proveedor B",
        "total_amount": 250.0,
        "line_items": []
    }

    mapping = {
        "Factura_ID": "invoice_number",
        "Emisor": "supplier_name",
        "Total": "total_amount"
    }

    buf = generate_erp_export([inv1, inv2], mapping, format="xlsx")
    assert isinstance(buf, io.BytesIO)
    df = pd.read_excel(buf)
    assert len(df) == 2
    assert list(df.columns) == ["Factura_ID", "Emisor", "Total"]
    assert df.iloc[0]["Factura_ID"] == "F-001"
    assert df.iloc[1]["Total"] == 250.0

def test_generate_erp_export_csv():
    inv1 = MagicMock()
    inv1.extracted_data = {
        "invoice_number": "F-CSV",
        "total_amount": 50.0
    }

    mapping = {
        "Num": "invoice_number",
        "Importe": "total_amount"
    }

    buf = generate_erp_export([inv1], mapping, format="csv")
    assert isinstance(buf, io.BytesIO)
    df = pd.read_csv(buf)
    assert len(df) == 1
    assert df.iloc[0]["Num"] == "F-CSV"


def test_preconfigured_erp_templates_exist_and_export():
    from routers.mappings import PRECONFIGURED_ERP_TEMPLATES

    expected_ids = {"quickbooks", "xero", "sap_b1", "sage", "netsuite", "holded", "a3_wolters"}
    found_ids = {t["id"] for t in PRECONFIGURED_ERP_TEMPLATES}
    assert expected_ids.issubset(found_ids)

    inv = MagicMock()
    inv.extracted_data = {
        "invoice_number": "INV-2026-99",
        "issue_date": "2026-11-05",
        "due_date": "2026-12-05",
        "supplier_name": "Acme UK Ltd",
        "supplier_tax_id": "GB123456789",
        "customer_name": "Client US Inc",
        "subtotal": 1000.0,
        "tax_amount": 200.0,
        "retention_amount": 0.0,
        "total_amount": 1200.0,
        "currency": "GBP",
    }

    for tpl in PRECONFIGURED_ERP_TEMPLATES:
        buf = generate_erp_export([inv], tpl["config"], format="csv")
        df = pd.read_csv(buf)
        assert len(df) == 1
        assert list(df.columns) == list(tpl["config"].keys())


def test_gemini_model_setting_from_config():
    from core.config import settings
    assert hasattr(settings, "GEMINI_MODEL")
    assert isinstance(settings.GEMINI_MODEL, str)
    assert len(settings.GEMINI_MODEL) > 0
