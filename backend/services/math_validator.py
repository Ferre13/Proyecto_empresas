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

    subtotal = data.get("subtotal") or 0.0
    tax_amount = data.get("tax_amount") or 0.0
    total_amount = data.get("total_amount") or 0.0

    # 2. Validación de Suma Básica (Margen de error de 0.01 por redondeos)
    expected_total = round(subtotal + tax_amount, 2)
    actual_total = round(total_amount, 2)

    if abs(expected_total - actual_total) > 0.01:
        return False, f"Error matemático: Subtotal({subtotal}) + Impuestos({tax_amount}) != Total({total_amount})"

    # 3. Validación de campos críticos obligatorios
    critical_fields = ["supplier_name", "invoice_number", "issue_date"]
    for field in critical_fields:
        if not data.get(field):
            return False, f"Campo crítico ausente: {field}"

    # 4. Validación de líneas de detalle (opcional pero recomendada)
    line_items = data.get("line_items", [])
    if line_items:
        lines_sum = sum(item.get("total_amount", 0.0) for item in line_items)
        if abs(round(lines_sum, 2) - round(subtotal, 2)) > 0.05: # Margen ligeramente mayor para líneas
            return False, "La suma de las líneas de detalle no coincide con el subtotal."

    return True, "Validación exitosa."
