import React, { useState, useEffect } from 'react';
import api from '../services/api';

const theme = {
  surface: 'var(--surface)',
  text: 'var(--text)',
  textSecondary: 'var(--text-sec)',
  accent: 'var(--accent)',
  border: 'var(--border)',
  shadow: 'var(--shadow)',
  radius: '16px',
  radiusSmall: '12px',
  bg: 'var(--bg)',
  success: 'var(--success)',
  error: 'var(--error)',
  warning: 'var(--warning)'
};

const CANONICAL_FIELDS = [
  { id: 'invoice_number', label: 'Número de Factura', defaultHeader: 'Nº Factura', hint: 'Ej. NºFactura, NumFactura, InvoiceNo...' },
  { id: 'issue_date', label: 'Fecha de Emisión', defaultHeader: 'Fecha Emisión', hint: 'Ej. FechaEmision, IssueDate, Fecha...' },
  { id: 'due_date', label: 'Fecha de Vencimiento', defaultHeader: 'Fecha Vencimiento', hint: 'Ej. Vencimiento, DueDate...' },
  { id: 'supplier_name', label: 'Razón Social del Proveedor', defaultHeader: 'Nombre Proveedor', hint: 'Ej. RazonSocial, Proveedor, Supplier...' },
  { id: 'supplier_tax_id', label: 'Identificación Fiscal del Proveedor', defaultHeader: 'NIF/CIF Proveedor', hint: 'Ej. NIFProveedor, CIF_Proveedor, TaxID...' },
  { id: 'customer_name', label: 'Razón Social del Cliente', defaultHeader: 'Nombre Cliente', hint: 'Ej. Cliente, Customer, Empresa...' },
  { id: 'customer_tax_id', label: 'Identificación Fiscal del Cliente', defaultHeader: 'NIF/CIF Cliente', hint: 'Ej. NIFCliente, CIF_Cliente...' },
  { id: 'subtotal', label: 'Base Imponible', defaultHeader: 'Base Imponible', hint: 'Ej. BaseImponible, Subtotal, NetAmount...' },
  { id: 'tax_amount', label: 'Cuota de Impuestos (IVA)', defaultHeader: 'Importe IVA', hint: 'Ej. IVA, Impuestos, TaxTotal...' },
  { id: 'total_amount', label: 'Importe Total de Factura', defaultHeader: 'Total Factura', hint: 'Ej. Total, ImporteTotal, GrossAmount...' },
  { id: 'currency', label: 'Moneda de Facturación', defaultHeader: 'Divisa', hint: 'Ej. Moneda, Divisa, Currency...' },
];

function Mapping() {
  const [erpName, setErpName] = useState('Excel / CSV');
  const [mode, setMode] = useState('manual');
  const [status, setStatus] = useState('');
  const [detectedHeaders, setDetectedHeaders] = useState([]);
  const [excelMapping, setExcelMapping] = useState({});
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  const [manualFields, setManualFields] = useState(
    CANONICAL_FIELDS.map((f, index) => ({
      ...f,
      customLabel: f.defaultHeader,
      active: true,
      order: index
    }))
  );

  // Cargar configuración guardada al cargar la página
  useEffect(() => {
    const fetchMapping = async () => {
      try {
        const res = await api.get('/mappings/');
        if (res.data && res.data.length > 0) {
          const saved = res.data[0];
          if (saved.erp_name) setErpName(saved.erp_name);
          
          const config = saved.config || {};
          if (Object.keys(config).length > 0) {
            const mappedIds = new Set();
            const reorderedFields = [];

            // 1. Columnas activas guardadas en su orden
            Object.entries(config).forEach(([customCol, canonicalId]) => {
              const original = CANONICAL_FIELDS.find(f => f.id === canonicalId);
              if (original) {
                mappedIds.add(canonicalId);
                reorderedFields.push({
                  ...original,
                  customLabel: customCol,
                  active: true
                });
              }
            });

            // 2. Columnas desactivadas
            CANONICAL_FIELDS.forEach(f => {
              if (!mappedIds.has(f.id)) {
                reorderedFields.push({
                  ...f,
                  customLabel: f.defaultHeader,
                  active: false
                });
              }
            });

            setManualFields(reorderedFields);
          }
        }
      } catch (err) {
        console.error("Error al cargar mapeos:", err);
      }
    };
    fetchMapping();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setStatus('Analizando la estructura del archivo Excel/CSV...');
      const res = await api.post('/mappings/detect-headers', formData);
      setDetectedHeaders(res.data.columns);
      setStatus('Encabezados detectados correctamente. Selecciona la equivalencia de cada columna.');
    } catch (err) { 
      setStatus('Error al leer el archivo. Asegúrate de que es un CSV o Excel válido.'); 
    }
  };

  const handleManualToggle = (id) => {
    setManualFields(manualFields.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const handleManualLabelChange = (id, newLabel) => {
    setManualFields(manualFields.map(f => f.id === id ? { ...f, customLabel: newLabel } : f));
  };

  // Reordenación drag and drop
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newFields = [...manualFields];
    const item = newFields.splice(draggedIndex, 1)[0];
    newFields.splice(index, 0, item);
    setManualFields(newFields);
    setDraggedIndex(null);
  };

  const handleSave = async (isManual) => {
    try {
      setStatus('Guardando configuración de mapeo...');
      const config = {};
      if (isManual) {
        manualFields.filter(f => f.active).forEach(f => { 
          config[f.customLabel || f.defaultHeader] = f.id; 
        });
      } else {
        Object.entries(excelMapping).forEach(([k, v]) => { 
          if (v) config[k] = v; 
        });
      }
      
      await api.post('/mappings/', { erp_name: erpName, config });
      setStatus('✅ Configuración de mapeo guardada correctamente.');
    } catch (err) { 
      setStatus('Error al guardar la configuración de mapeo.'); 
    }
  };

  const cardStyle = {
    background: theme.surface,
    padding: '36px',
    borderRadius: theme.radius,
    boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`,
    marginBottom: '32px'
  };

  const buttonStyle = (disabled = false) => ({
    padding: '12px 20px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    pointerEvents: disabled ? 'none' : 'auto'
  });

  const textInputStyle = {
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.bg,
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: theme.text,
    width: '100%',
    outline: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flex: 1,
    boxSizing: 'border-box'
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .config-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
          background-color: var(--surface);
        }
        .grip-handle {
          cursor: grab;
          color: var(--text-sec);
          display: flex;
          align-items: center;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .grip-handle:hover {
          background-color: var(--border);
          color: var(--text);
        }
        .grip-handle:active {
          cursor: grabbing;
        }
        .manual-field-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 24px;
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .manual-field-card:hover {
          border-color: var(--accent);
          box-shadow: 0 4px 14px rgba(0, 122, 255, 0.06);
        }
      `}</style>
      
      <div style={cardStyle}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.03em', margin: '0 0 6px 0', color: theme.text }}>
            Configuración de Columnas para ERP
          </h2>
          <p style={{ color: theme.textSecondary, fontSize: '15px', margin: '0 0 24px 0', lineHeight: '1.5' }}>
            Define el nombre exacto de las columnas con las que tu programa contable (SAP, Holded, Sage, A3, etc.) procesa las facturas exportadas.
          </p>

          <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.textSecondary }}>
            Nombre de la Configuración de Exportación
          </label>
          <input 
            type="text" 
            className="config-input"
            value={erpName} 
            onChange={(e) => setErpName(e.target.value)}
            style={{ ...textInputStyle, padding: '14px 18px', fontSize: '15px', fontWeight: '700' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', backgroundColor: 'var(--bg)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <button onClick={() => setMode('manual')} style={{ ...buttonStyle(), flex: 1, backgroundColor: mode === 'manual' ? theme.surface : 'transparent', color: mode === 'manual' ? theme.accent : theme.textSecondary, boxShadow: mode === 'manual' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
            Personalización Manual
          </button>
          <button onClick={() => setMode('excel')} style={{ ...buttonStyle(), flex: 1, backgroundColor: mode === 'excel' ? theme.surface : 'transparent', color: mode === 'excel' ? theme.accent : theme.textSecondary, boxShadow: mode === 'excel' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
            Detección por Excel / CSV de Ejemplo
          </button>
        </div>

        {status && (
          <div style={{ 
            marginBottom: '28px', 
            padding: '16px', 
            borderRadius: '12px', 
            backgroundColor: status.includes('Error') ? 'rgba(255, 59, 48, 0.05)' : 'rgba(0, 122, 255, 0.05)', 
            color: status.includes('Error') ? theme.error : theme.accent, 
            fontSize: '14px', 
            fontWeight: '600', 
            textAlign: 'center', 
            border: `1px solid ${status.includes('Error') ? 'rgba(255, 59, 48, 0.1)' : 'rgba(0, 122, 255, 0.1)'}` 
          }}>
            {status}
          </div>
        )}

        {mode === 'manual' ? (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: theme.text }}>
                  Columnas Incluidas en la Exportación
                </h4>
                <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: '500' }}>
                  Arrastra los iconos para reordenar la secuencia en Excel
                </span>
              </div>

              {manualFields.map((field, index) => {
                if (!field.active) return null;
                return (
                  <div 
                    key={field.id} 
                    className="manual-field-card"
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    style={{ 
                      opacity: draggedIndex === index ? 0.4 : 1,
                      transform: draggedIndex === index ? 'scale(0.98)' : 'scale(1)'
                    }}
                  >
                    <div 
                      className="grip-handle"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, index)}
                      title="Mantén presionado y arrastra para reordenar"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="12" r="0.8"></circle>
                        <circle cx="9" cy="5" r="0.8"></circle>
                        <circle cx="9" cy="19" r="0.8"></circle>
                        <circle cx="15" cy="12" r="0.8"></circle>
                        <circle cx="15" cy="5" r="0.8"></circle>
                        <circle cx="15" cy="19" r="0.8"></circle>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: theme.text }}>
                          {field.label}
                        </span>
                        <span style={{ fontSize: '11px', color: theme.success, fontWeight: '700', backgroundColor: 'rgba(52, 199, 89, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                          🟢 Incluida
                        </span>
                      </div>
                      <input 
                        type="text" 
                        className="config-input"
                        value={field.customLabel} 
                        onChange={(e) => handleManualLabelChange(field.id, e.target.value)}
                        style={textInputStyle} 
                        placeholder={field.hint}
                      />
                    </div>
                    <button 
                      onClick={() => handleManualToggle(field.id)} 
                      style={{ padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: 'transparent', color: theme.textSecondary, fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                      title="Excluir esta columna de la exportación a Excel"
                    >
                      Excluir
                    </button>
                  </div>
                );
              })}

              {manualFields.some(f => !f.active) && (
                <>
                  <h4 style={{ margin: '32px 0 8px 0', fontSize: '16px', fontWeight: '700', color: theme.textSecondary }}>
                    Columnas Excluidas de la Exportación
                  </h4>
                  {manualFields.filter(f => !f.active).map((field) => (
                    <div key={field.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: 'var(--bg)', border: `1px dashed var(--border)`, borderRadius: '14px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: theme.textSecondary }}>{field.label}</div>
                        <div style={{ fontSize: '12px', color: theme.textSecondary, opacity: 0.7, marginTop: '2px' }}>Esta columna no aparecerá en el Excel descargado</div>
                      </div>
                      <button onClick={() => handleManualToggle(field.id)} style={{ padding: '10px 18px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.surface, color: theme.accent, fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                        ➕ Incluir en Excel
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>

            <button 
              className="apple-btn" 
              onClick={() => handleSave(true)} 
              style={{ ...buttonStyle(), width: '100%', backgroundColor: theme.accent, color: '#FFF', marginTop: '36px', fontSize: '15px', height: '52px', boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)' }}
            >
              Guardar Configuración de Mapeo
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: '64px 32px', border: `2px dashed var(--border)`, borderRadius: '16px', backgroundColor: 'var(--bg)', marginBottom: '32px' }}>
              <div style={{ fontSize: '44px', marginBottom: '14px' }}>📊</div>
              <p style={{ fontWeight: '700', color: theme.text, margin: '0 0 6px 0', fontSize: '16px' }}>Subir Excel o CSV de Ejemplo de tu ERP</p>
              <p style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '20px' }}>Detectaremos las columnas automáticamente para ayudarte a asociarlas</p>
              <input type="file" onChange={handleFileChange} style={{ fontSize: '14px', fontWeight: '600', color: theme.accent }} />
            </div>

            {detectedHeaders.length > 0 && (
              <div style={{ textAlign: 'left', animation: 'fadeIn 0.3s ease-out' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0 16px 8px 16px', color: theme.textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Columna en tu Excel / ERP</th>
                      <th style={{ textAlign: 'left', padding: '0 16px 8px 16px', color: theme.textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dato Extraído por la IA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detectedHeaders.map(col => (
                      <tr key={col}>
                        <td style={{ padding: '14px 18px', fontWeight: '700', fontSize: '14px', backgroundColor: 'var(--bg)', borderRadius: '12px 0 0 12px', border: `1px solid var(--border)`, borderRight: 'none' }}>{col}</td>
                        <td style={{ padding: '14px 18px', backgroundColor: 'var(--bg)', borderRadius: '0 12px 12px 0', border: `1px solid var(--border)`, borderLeft: 'none' }}>
                          <select onChange={(e) => setExcelMapping({ ...excelMapping, [col]: e.target.value })} style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid var(--border)`, backgroundColor: theme.surface, width: '100%', color: theme.text, fontSize: '14px', fontWeight: '600', outline: 'none' }}>
                            <option value="">-- Descartar esta columna --</option>
                            {CANONICAL_FIELDS.map(cf => <option key={cf.id} value={cf.id}>{cf.label}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="apple-btn" onClick={() => handleSave(false)} style={{ ...buttonStyle(), width: '100%', backgroundColor: theme.accent, color: '#FFF', marginTop: '32px', fontSize: '15px', height: '52px', boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)' }}>
                  Guardar Mapeo por Excel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Mapping;
