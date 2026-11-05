import pytest
from services.math_validator import validate_invoice_math

def test_math_validator_standard_valid():
    data = {
        "is_valid_invoice": True,
        "supplier_name": "Acme S.L.",
        "invoice_number": "INV-2026-001",
        "issue_date": "2026-03-01",
        "subtotal": 100.0,
        "tax_amount": 21.0,
        "total_amount": 121.0,
        "line_items": [
            {"description": "Item 1", "total_amount": 100.0}
        ]
    }
    is_valid, msg = validate_invoice_math(data)
    assert is_valid is True
    assert "exitosa" in msg

def test_math_validator_with_retention_irpf():
    # Base: 1000, IVA 21%: 210, IRPF 15%: 150 -> Total: 1060
    data = {
        "is_valid_invoice": True,
        "supplier_name": "Juan Perez Autonomo",
        "invoice_number": "F-002",
        "issue_date": "2026-03-01",
        "subtotal": 1000.0,
        "tax_amount": 210.0,
        "retention_amount": 150.0,
        "total_amount": 1060.0
    }
    is_valid, msg = validate_invoice_math(data)
    assert is_valid is True

def test_math_validator_with_spanish_rate_deduction():
    # Base 500, IVA 21%: 105, Total: 530 (difference is 75 = 15% of 500)
    data = {
        "is_valid_invoice": True,
        "supplier_name": "Consultor IT",
        "invoice_number": "F-003",
        "issue_date": "2026-03-01",
        "subtotal": 500.0,
        "tax_amount": 105.0,
        "total_amount": 530.0
    }
    is_valid, msg = validate_invoice_math(data)
    assert is_valid is True

def test_math_validator_safe_with_null_line_item():
    # Should not raise TypeError when total_amount is explicitly None
    data = {
        "is_valid_invoice": True,
        "supplier_name": "Empresa Test",
        "invoice_number": "INV-99",
        "issue_date": "2026-03-01",
        "subtotal": 50.0,
        "tax_amount": 10.5,
        "total_amount": 60.5,
        "line_items": [
            {"description": "Item without amount", "total_amount": None},
            {"description": "Item 2", "total_amount": 50.0}
        ]
    }
    is_valid, msg = validate_invoice_math(data)
    assert is_valid is True

def test_math_validator_invalid_math():
    data = {
        "is_valid_invoice": True,
        "supplier_name": "Acme S.L.",
        "invoice_number": "INV-2026-001",
        "issue_date": "2026-03-01",
        "subtotal": 100.0,
        "tax_amount": 21.0,
        "total_amount": 999.0
    }
    is_valid, msg = validate_invoice_math(data)
    assert is_valid is False
    assert "Error matemático" in msg

def test_math_validator_missing_critical_field():
    data = {
        "is_valid_invoice": True,
        "supplier_name": "Acme S.L.",
        "invoice_number": None, # Missing!
        "issue_date": "2026-03-01",
        "subtotal": 100.0,
        "tax_amount": 21.0,
        "total_amount": 121.0
    }
    is_valid, msg = validate_invoice_math(data)
    assert is_valid is False
    assert "invoice_number" in msg

def test_math_validator_dynamic_erp_required_fields():
    # Invoice missing due_date, which is required in Oracle NetSuite but not in a 1-field custom ERP
    data = {
        "ai_is_valid_document": True,
        "is_valid_invoice": False, # Previously failed in another ERP
        "supplier_name": "Acme S.L.",
        "invoice_number": "INV-2026-009",
        "issue_date": "2026-03-01",
        "due_date": None,
        "subtotal": 100.0,
        "tax_amount": 21.0,
        "total_amount": 121.0
    }
    # 1. With 1-field custom mapping requiring only invoice_number -> Valid!
    is_valid_custom, msg_custom = validate_invoice_math(data, required_fields=["invoice_number"])
    assert is_valid_custom is True
    assert "exitosa" in msg_custom

    # 2. Switching to Oracle NetSuite (requires due_date) -> Needs review!
    is_valid_oracle, msg_oracle = validate_invoice_math(
        data,
        required_fields=["invoice_number", "issue_date", "due_date", "supplier_name", "total_amount"]
    )
    assert is_valid_oracle is False
    assert "due_date" in msg_oracle


def test_math_validator_rejects_dot_placeholder():
    # Gemini sometimes outputs "." or "N/A" when a field is missing
    data = {
        "ai_is_valid_document": True,
        "is_valid_invoice": True,
        "supplier_name": "Glovoapp Spain Platform S.L.",
        "invoice_number": "ES2026-B672828710013758256",
        "issue_date": "2026-03-13",
        "due_date": ".",
        "customer_name": ".",
        "subtotal": 3.29,
        "tax_amount": 0.69,
        "total_amount": 3.98
    }
    is_valid, msg = validate_invoice_math(
        data,
        required_fields=["invoice_number", "due_date", "total_amount"]
    )
    assert is_valid is False
    assert "due_date" in msg
    assert data["due_date"] is None
    assert data["customer_name"] is None


