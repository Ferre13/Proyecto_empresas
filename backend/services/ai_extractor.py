import os
import json
import google.generativeai as genai
from core.config import settings
from typing import Optional, Dict, Any

# Configurar la API de Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

# Usamos Gemini 2.5 Flash como motor de extracción híbrido
MODEL_NAME = 'gemini-2.5-flash' 

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

def extract_invoice_data_with_gemini(file_path: str, mime_type: str) -> Dict[str, Any]:
    # Paso 1: Subir el archivo (Stateless Pilar 3)
    uploaded_file = genai.upload_file(path=file_path, mime_type=mime_type)
    
    try:
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=SYSTEM_PROMPT,
        )
        
        # Paso 2: Generar contenido con Structured Outputs (Pilar 4)
        response = model.generate_content(
            [uploaded_file, "Extrae los datos financieros de esta factura según el esquema JSON."],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=SCHEMA,
                temperature=0.0,
            )
        )
        
        return json.loads(response.text)
        
    finally:
        # Paso 3: Borrar archivo de Google (Muro Legal)
        genai.delete_file(uploaded_file.name)
