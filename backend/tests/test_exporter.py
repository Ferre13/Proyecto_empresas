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
