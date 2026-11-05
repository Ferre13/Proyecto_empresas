from typing import Dict, Any, Tuple
from schemas.invoice import CanonicalInvoiceSchema

def validate_invoice_math(data: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Verifica la integridad matemática de los datos extraídos por la IA.
    Retorna: (is_valid, error_message)
    """
    # 1. Si la IA ya marcó que no es una factura, no validamos matemáticas
    if not data.get("is_valid_invoice"):
        return False, "Documento marcado como inválido por la IA."

    subtotal = float(data.get("subtotal") or 0.0)
    tax_amount = float(data.get("tax_amount") or 0.0)
    retention_amount = float(data.get("retention_amount") or 0.0)
    total_amount = float(data.get("total_amount") or 0.0)

    # 2. Validación de Suma Básica con tolerancia de 0.02
    expected_total_standard = round(subtotal + tax_amount, 2)
    expected_total_with_retention = round(subtotal + tax_amount - retention_amount, 2)
    actual_total = round(total_amount, 2)

    diff_standard = abs(expected_total_standard - actual_total)
    diff_retention = abs(expected_total_with_retention - actual_total)

    is_sum_valid = (diff_standard <= 0.02) or (retention_amount > 0 and diff_retention <= 0.02)

    # Si no cuadra directamente pero la diferencia coincide con un % típico de IRPF español sobre la base
    if not is_sum_valid and subtotal > 0:
        difference = round(expected_total_standard - actual_total, 2)
        if difference > 0:
            retention_rate = round(difference / subtotal, 2)
            if retention_rate in [0.01, 0.02, 0.07, 0.09, 0.15, 0.19, 0.21]:
                is_sum_valid = True

    if not is_sum_valid:
        return False, f"Error matemático: Subtotal({subtotal}) + Impuestos({tax_amount}) != Total({total_amount})"

    # 3. Validación de campos críticos obligatorios
    critical_fields = ["supplier_name", "invoice_number", "issue_date"]
    for field in critical_fields:
        if not data.get(field):
            return False, f"Campo crítico ausente: {field}"

    # 4. Validación de líneas de detalle (blindada contra None)
    line_items = data.get("line_items", [])
    if line_items and isinstance(line_items, list):
        lines_sum = sum(float(item.get("total_amount") or 0.0) for item in line_items if isinstance(item, dict))
        if subtotal > 0 and abs(round(lines_sum, 2) - round(subtotal, 2)) > 0.05:
            # Tolerancia alternativa si las líneas venían con IVA incluido
            if abs(round(lines_sum, 2) - round(total_amount, 2)) > 0.05:
                return False, "La suma de las líneas de detalle no coincide con el subtotal."

    return True, "Validación exitosa."
