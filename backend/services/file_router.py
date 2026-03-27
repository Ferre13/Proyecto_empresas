import os
import pandas as pd
from docx import Document
from typing import Tuple, Optional

def route_file_and_extract_text(file_path: str) -> Tuple[str, Optional[str]]:
    """
    Pilar 1: Determina el tipo de archivo y extrae texto si es posible (Word/Excel/CSV)
    para ahorrar tokens. Si es PDF o Imagen, devuelve 'visual' para ir a Gemini Multimodal.
    
    Retorna: (mode, extracted_text)
    mode: 'visual' o 'text'
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    # Archivos que requieren procesamiento Visual (Multimodal)
    if ext in ['.pdf', '.jpg', '.jpeg', '.png', '.webp']:
        return ('visual', None)
    
    # Extracción de texto para Excel
    elif ext in ['.xlsx', '.xls', '.csv']:
        try:
            if ext == '.csv':
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
            # Convertimos el DataFrame a un formato de texto legible para la IA
            return ('text', df.to_string(index=False))
        except Exception:
            # Si falla la lectura como datos, intentamos visual por si acaso
            return ('visual', None)
            
    # Extracción de texto para Word
    elif ext in ['.docx']:
        try:
            doc = Document(file_path)
            full_text = [para.text for para in doc.paragraphs]
            return ('text', "\n".join(full_text))
        except Exception:
            return ('visual', None)
            
    # Por defecto, intentamos visual si la extensión es desconocida
    return ('visual', None)
