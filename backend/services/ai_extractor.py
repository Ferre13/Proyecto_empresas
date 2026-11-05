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
REGLA ESTRICTA DE CAMPOS AUSENTES:
- No inventes datos bajo ningún concepto.
- Si un campo de texto o fecha (como due_date, customer_name, customer_tax_id, etc.) NO aparece explícitamente en el documento, devuélvelo como una cadena vacía "" o null.
- PROHIBIDO usar placeholders como ".", "-", "N/A", "null", "none" o "sin datos".
"""

# Esquema manual para evitar el error de 'default' en la SDK
SCHEMA = {
    "type": "object",
    "properties": {
        "is_valid_invoice": {"type": "boolean"},
        "invoice_number": {"type": "string", "nullable": True},
        "issue_date": {"type": "string", "nullable": True, "description": "Formato YYYY-MM-DD o null si no existe"},
        "due_date": {"type": "string", "nullable": True, "description": "Formato YYYY-MM-DD o null si no existe fecha de vencimiento"},
        "supplier_name": {"type": "string", "nullable": True},
        "supplier_tax_id": {"type": "string", "nullable": True},
        "customer_name": {"type": "string", "nullable": True},
        "customer_tax_id": {"type": "string", "nullable": True},
        "subtotal": {"type": "number", "nullable": True},
        "tax_amount": {"type": "number", "nullable": True},
        "retention_amount": {"type": "number", "nullable": True, "description": "Importe de retención IRPF si aplica"},
        "total_amount": {"type": "number", "nullable": True},
        "currency": {"type": "string", "nullable": True, "description": "Código ISO ej. EUR"},
        "line_items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "description": {"type": "string"},
                    "quantity": {"type": "number", "nullable": True},
                    "unit_price": {"type": "number", "nullable": True},
                    "total_amount": {"type": "number"}
                },
                "required": ["description", "total_amount"]
            }
        }
    },
    "required": ["is_valid_invoice"]
}

PLACEHOLDER_STRINGS = {
    "", ".", "..", "...", "-", "--", "—", "_", "/",
    "null", "none", "n/a", "na", "n.a.", "nil", "undefined",
    "sin datos", "no disponible", "desconocido", "unknown"
}

def sanitize_extracted_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convierte placeholders basura de la IA ('.', 'null', 'N/A', '-') en None real."""
    if not isinstance(data, dict):
        return data
    cleaned = {}
    for k, v in data.items():
        if isinstance(v, str):
            stripped = v.strip()
            if stripped.lower() in PLACEHOLDER_STRINGS:
                cleaned[k] = None
            else:
                cleaned[k] = stripped
        else:
            cleaned[k] = v
    return cleaned

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
    parsed = json.loads(text)
    return sanitize_extracted_data(parsed)

# Modelos de respaldo automático si el principal agota la cuota gratuita (429 ResourceExhausted)
FALLBACK_GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
    "gemini-flash-lite-latest",
    "gemini-2.5-pro",
]

def extract_invoice_data_with_gemini(
    file_path: Optional[str] = None, 
    mime_type: Optional[str] = None,
    text_content: Optional[str] = None
) -> Dict[str, Any]:
    """
    Extrae datos de la factura utilizando el modelo configurado en .env (por defecto gemini-2.5-flash)
    con fallback automático a modelos alternativos de Gemini si se alcanza el límite de cuota (429).
    Soporta modo visual (PDF/Imágenes) mediante genai.upload_file y modo texto (Word/Excel/CSV).
    """
    primary_model = settings.GEMINI_MODEL or MODEL_NAME
    candidate_models = [primary_model] + [m for m in FALLBACK_GEMINI_MODELS if m != primary_model]

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
        last_err = None
        for model_id in candidate_models:
            try:
                model = genai.GenerativeModel(model_name=model_id, system_instruction=SYSTEM_PROMPT)
                response = model.generate_content(prompt, generation_config=generation_config)
                return clean_json_response(response.text)
            except Exception as err:
                last_err = err
                if "429" in str(err) or "Quota" in str(err) or "ResourceExhausted" in str(err) or "404" in str(err):
                    print(f"⚠️ Cuota/Disponibilidad alcanzada en {model_id}, rotando al siguiente modelo disponible...")
                    continue
                raise err
        raise last_err

    # Modo Visual / Binario (PDF, JPG, PNG)
    uploaded_file = None
    try:
        uploaded_file = genai.upload_file(path=file_path, mime_type=mime_type)
        last_err = None
        for model_id in candidate_models:
            try:
                model = genai.GenerativeModel(model_name=model_id, system_instruction=SYSTEM_PROMPT)
                response = model.generate_content(
                    [uploaded_file, "Extrae los datos financieros de esta factura según el esquema JSON."],
                    generation_config=generation_config
                )
                return clean_json_response(response.text)
            except Exception as err:
                last_err = err
                if "429" in str(err) or "Quota" in str(err) or "ResourceExhausted" in str(err) or "404" in str(err):
                    print(f"⚠️ Cuota/Disponibilidad alcanzada en {model_id}, rotando al siguiente modelo disponible...")
                    continue
                raise err
        raise last_err
    finally:
        # Paso 3: Borrar archivo de Google (Muro Legal / RGPD)
        if uploaded_file is not None:
            try:
                genai.delete_file(uploaded_file.name)
            except Exception as e:
                print(f"Advertencia eliminando archivo temporal en Gemini: {e}")
