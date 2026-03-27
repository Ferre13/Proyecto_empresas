import React, { useState } from 'react';
import api from '../services/api';

const CANONICAL_FIELDS = [
  { id: 'invoice_number', label: 'Número de Factura' },
  { id: 'issue_date', label: 'Fecha de Emisión' },
  { id: 'due_date', label: 'Fecha de Vencimiento' },
  { id: 'supplier_name', label: 'Nombre Proveedor' },
  { id: 'supplier_tax_id', label: 'CIF/NIF Proveedor' },
  { id: 'customer_name', label: 'Nombre Cliente' },
  { id: 'subtotal', label: 'Base Imponible' },
  { id: 'tax_amount', label: 'Importe Impuestos' },
  { id: 'total_amount', label: 'Total Factura' },
  { id: 'currency', label: 'Moneda' },
];

function Mapping() {
  const [erpName, setErpName] = useState('SAP');
  const [detectedHeaders, setDetectedHeaders] = useState([]);
  const [mappingConfig, setMappingConfig] = useState({});
  const [status, setStatus] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      setStatus('Analizando columnas del Excel...');
      const res = await api.post('/mappings/detect-headers', formData);
      setDetectedHeaders(res.data.columns);
      setStatus('Columnas detectadas. Ahora asocia cada una con un campo de la IA.');
    } catch (err) {
      setStatus('Error al leer el archivo.');
    }
  };

  const handleSelectChange = (erpCol, canonicalId) => {
    setMappingConfig({
      ...mappingConfig,
      [erpCol]: canonicalId
    });
  };

  const handleSave = async () => {
    try {
      setStatus('Guardando configuración...');
      // Limpiamos el objeto para no enviar mapeos vacíos
      const cleanConfig = Object.fromEntries(
        Object.entries(mappingConfig).filter(([_, v]) => v !== "")
      );

      await api.post('/mappings/', {
        erp_name: erpName,
        config: cleanConfig
      });
      setStatus('✅ Configuración guardada. Ya puedes exportar tus lotes.');
    } catch (err) {
      setStatus('Error al guardar el mapeo.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Configuración de Exportación (Motor de Mapeo)</h2>
      <p>Sube un archivo Excel/CSV con los encabezados que pide tu ERP.</p>

      <div style={{ marginBottom: '20px' }}>
        <label>Nombre del ERP: </label>
        <input 
          type="text" 
          value={erpName} 
          onChange={(e) => setErpName(e.target.value)}
          placeholder="Ej: SAP, Holded..."
        />
      </div>

      <input type="file" onChange={handleFileChange} />
      <p><strong>Estado:</strong> {status}</p>

      {detectedHeaders.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Asociar Columnas</h3>
          <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th>Columna detectada en tu Excel</th>
                <th>Dato de la IA (Gemini)</th>
              </tr>
            </thead>
            <tbody>
              {detectedHeaders.map(col => (
                <tr key={col}>
                  <td><strong>{col}</strong></td>
                  <td>
                    <select onChange={(e) => handleSelectChange(col, e.target.value)}>
                      <option value="">-- Ignorar esta columna --</option>
                      {CANONICAL_FIELDS.map(cf => (
                        <option key={cf.id} value={cf.id}>{cf.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button 
            onClick={handleSave}
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: 'blue', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Guardar Mapeo
          </button>
        </div>
      )}
    </div>
  );
}

export default Mapping;
