import pandas as pd
import io
from typing import List, Dict
from models.invoice import Invoice

def generate_erp_export(invoices: List[Invoice], mapping_config: Dict[str, str], format: str = "xlsx") -> io.BytesIO:
    """
    Pilar 4: Transforma el Modelo Canónico al formato del ERP del cliente.
    mapping_config: {"Columna_ERP_A": "campo_canonico_X", "Columna_ERP_B": "campo_canonico_Y"}
    """
    export_data = []

    for inv in invoices:
        if not inv.extracted_data:
            continue
            
        # Creamos una fila para el Excel final basada en el mapeo
        row = {}
        for erp_column, canonical_key in mapping_config.items():
            # Extraemos el valor del JSON canónico (manejando anidación simple si fuera necesario)
            value = inv.extracted_data.get(canonical_key, "")
            row[erp_column] = value
            
        export_data.append(row)

    # Crear el DataFrame de Pandas
    df = pd.DataFrame(export_data)

    # Guardar en buffer de memoria (Stateless Pilar 3)
    output = io.BytesIO()
    
    if format == "xlsx":
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='Facturas')
    else:
        # Por defecto CSV
        df.to_csv(output, index=False)
        
    output.seek(0)
    return output
