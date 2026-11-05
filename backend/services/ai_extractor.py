import os
import json
import google.generativeai as genai
from core.config import settings
from typing import Optional, Dict, Any

# Configurar la API de Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

# Modelo de extracción configurable desde .env (por defecto gemini-2.5-flash)
MODEL_NAME = settings.GEMINI_MODEL

SYSTEM_PROMPT = """
Eres un auditor experto en cuentas por pagar. Analiza la factura adjunta y extrae la información en formato JSON.
Si el documento NO es una factura, recibo o ticket, devuelve "is_valid_invoice": false.
REGLA: No inventes datos. Si un campo no existe, devuélvelo como null.
"""

# Esquema manual para evitar el error de 'default' en la SDK
SCHEMA = {
    "type": "object",
    "properties": {
        "is_valid_invoice": {"type": "boolean"},
        "invoice_number": {"type": "string"},
        "issue_date": {"type": "string", "description": "Formato YYYY-MM-DD"},
        "due_date": {"type": "string", "description": "Formato YYYY-MM-DD"},
        "supplier_name": {"type": "string"},
        "supplier_tax_id": {"type": "string"},
        "customer_name": {"type": "string"},
        "customer_tax_id": {"type": "string"},
        "subtotal": {"type": "number"},
        "tax_amount": {"type": "number"},
        "retention_amount": {"type": "number", "description": "Importe de retención IRPF si aplica"},
        "total_amount": {"type": "number"},
        "currency": {"type": "string", "description": "Código ISO ej. EUR"},
        "line_items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "description": {"type": "string"},
                    "quantity": {"type": "number"},
                    "unit_price": {"type": "number"},
                    "total_amount": {"type": "number"}
                },
                "required": ["description", "total_amount"]
            }
        }
    },
    "required": ["is_valid_invoice"]
}

def clean_json_response(raw_text: str) -> Dict[str, Any]:
    """Limpia posibles bloques markdown o caracteres extraños antes de parsear."""
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return json.loads(text)

def extract_invoice_data_with_gemini(
    file_path: Optional[str] = None, 
    mime_type: Optional[str] = None,
    text_content: Optional[str] = None
) -> Dict[str, Any]:
    """
    Extrae datos de la factura utilizando Gemini 2.5 Flash.
    Soporta modo visual (PDF/Imágenes) mediante genai.upload_file y modo texto (Word/Excel/CSV).
    """
    model = genai.GenerativeModel(
        model_name=settings.GEMINI_MODEL or MODEL_NAME,
        system_instruction=SYSTEM_PROMPT,
    )
    generation_config = genai.GenerationConfig(
        response_mime_type="application/json",
        response_schema=SCHEMA,
        temperature=0.0,
    )

    if text_content:
        # Modo Texto (Word/Excel/CSV) - Ahorro de ancho de banda y tokens
        prompt = (
            f"A continuación se presenta el contenido de texto extraído de un documento:\n\n"
            f"{text_content}\n\n"
            f"Extrae los datos financieros de esta factura según el esquema JSON."
        )
        response = model.generate_content(prompt, generation_config=generation_config)
        return clean_json_response(response.text)

    # Modo Visual / Binario (PDF, JPG, PNG)
    uploaded_file = None
    try:
        uploaded_file = genai.upload_file(path=file_path, mime_type=mime_type)
        response = model.generate_content(
            [uploaded_file, "Extrae los datos financieros de esta factura según el esquema JSON."],
            generation_config=generation_config
        )
        return clean_json_response(response.text)
    finally:
        # Paso 3: Borrar archivo de Google (Muro Legal / RGPD)
        if uploaded_file is not None:
            try:
                genai.delete_file(uploaded_file.name)
            except Exception as e:
                print(f"Advertencia eliminando archivo temporal en Gemini: {e}")
