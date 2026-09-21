import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  error: 'var(--error)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  bg: 'var(--bg)'
};

const ALL_EDITABLE_FIELDS = [
  'is_valid_invoice',
  'invoice_number',
  'issue_date',
  'due_date',
  'supplier_name',
  'supplier_tax_id',
  'customer_name',
  'customer_tax_id',
  'subtotal',
  'tax_amount',
  'total_amount',
  'currency'
];

const FIELD_LABELS = {
  is_valid_invoice: 'Validez del Documento',
  invoice_number: 'Número de Factura',
  issue_date: 'Fecha de Emisión',
  due_date: 'Fecha de Vencimiento',
  supplier_name: 'Proveedor (Razón Social)',
  supplier_tax_id: 'NIF / CIF Proveedor',
  customer_name: 'Cliente (Razón Social)',
  customer_tax_id: 'NIF / CIF Cliente',
  subtotal: 'Base Imponible (€)',
  tax_amount: 'Impuestos (€)',
  total_amount: 'Importe Total (€)',
  currency: 'Moneda'
};

const CURRENCY_OPTIONS = ['EUR', 'USD', 'GBP', 'JPY', 'CNY', 'MXN', 'BRL', 'CAD', 'AUD', 'CHF'];

function Triage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [batchInvoices, setBatchInvoices] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  // Estados para separación según Mapeo ERP
  const [activeFieldKeys, setActiveFieldKeys] = useState(ALL_EDITABLE_FIELDS);
  const [inactiveFieldKeys, setInactiveFieldKeys] = useState([]);
  const [showSecondaryFields, setShowSecondaryFields] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/invoices/${invoiceId}`);
        setInvoice(res.data);
        
        const rawData = res.data.extracted_data || {};
        const cleanedData = {};
        Object.keys(rawData).forEach(k => {
          cleanedData[k] = (rawData[k] === null || rawData[k] === 'null') ? '' : rawData[k];
        });
        setFormData(cleanedData);
        setIsDirty(false);

        const batchRes = await api.get(`/upload/batches/${res.data.batch_id}/invoices`);
        setBatchInvoices(batchRes.data);

        const fileRes = await api.get(`/invoices/${invoiceId}/file`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([fileRes.data], { type: 'application/pdf' }));
        setPdfUrl(url);
      } catch (err) {
        setError("Error cargando factura o PDF");
      }
    };

    const fetchMappingConfig = async () => {
      try {
        const res = await api.get('/mappings/');
        if (res.data && res.data.length > 0 && res.data[0].config) {
          const config = res.data[0].config;
          const mappedCanonicalIds = Object.values(config);

          const activeList = ['is_valid_invoice', ...mappedCanonicalIds.filter(id => id !== 'is_valid_invoice')];
          const inactiveList = ALL_EDITABLE_FIELDS.filter(id => id !== 'is_valid_invoice' && !mappedCanonicalIds.includes(id));

          setActiveFieldKeys(activeList);
          setInactiveFieldKeys(inactiveList);
        } else {
          setActiveFieldKeys(ALL_EDITABLE_FIELDS);
          setInactiveFieldKeys([]);
        }
      } catch (e) {
        setActiveFieldKeys(ALL_EDITABLE_FIELDS);
        setInactiveFieldKeys([]);
      }
    };

    fetchInvoice();
    fetchMappingConfig();
  }, [invoiceId]);

  const currentIndex = batchInvoices.findIndex(inv => inv.id === invoiceId);
  const prevInvoice = currentIndex > 0 ? batchInvoices[currentIndex - 1] : null;
  const nextInvoice = currentIndex < batchInvoices.length - 1 ? batchInvoices[currentIndex + 1] : null;

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async (andNavigate = false) => {
    try {
      await api.put(`/invoices/${invoiceId}`, { extracted_data: formData });
      setIsDirty(false);
      if (andNavigate) {
        if (nextInvoice) {
          navigate(`/triage/${nextInvoice.id}`);
        } else {
          navigate(`/batch/${invoice.batch_id}`);
        }
      }
    } catch (err) {
      alert("Error al guardar cambios");
    }
  };

  const safeNavigate = (targetPath) => {
    if (isDirty) {
      if (window.confirm("Tienes cambios sin guardar. ¿Deseas salir?")) {
        navigate(targetPath);
      }
    } else {
      navigate(targetPath);
    }
  };

  if (error) return <div style={{ color: theme.error, padding: '40px', textAlign: 'center' }}>{error}</div>;
  if (!invoice) return (
    <div style={{ padding: '60px', textAlign: 'center', color: theme.textSecondary }}>
      Cargando documento para revisión...
    </div>
  );

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: `1px solid ${theme.border}`,
    fontSize: '14px',
    backgroundColor: theme.surface,
    color: theme.text,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease-in-out',
    fontFamily: 'inherit',
    fontWeight: '500'
  };

  const buttonStyle = (disabled = false) => ({
    padding: '10px 20px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    pointerEvents: disabled ? 'none' : 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  });

  const renderSingleField = (key, isSecondary = false) => {
    const label = FIELD_LABELS[key] || key;
    const val = formData[key];
    const isMissing = (val === undefined || val === '' || val === null || val === 'null');

    if (key === 'is_valid_invoice') {
      const isValid = formData[key] !== false;
      return (
        <div key={key} style={{
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: isValid ? 'rgba(52, 199, 89, 0.08)' : 'rgba(255, 149, 0, 0.08)',
          border: `1px solid ${isValid ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 149, 0, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: theme.text }}>Validez de la Factura</div>
            <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '2px' }}>
              {isValid ? 'Formato y estructura correctos para contabilizar' : 'Requiere revisión o datos incompletos'}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
            <input 
              type="checkbox" 
              checked={isValid} 
              onChange={(e) => handleFieldChange(key, e.target.checked)} 
              style={{ width: '18px', height: '18px', accentColor: theme.success }}
            />
            Válida
          </label>
        </div>
      );
    }

    return (
      <div key={key} style={{ opacity: isSecondary ? 0.85 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontWeight: '700', fontSize: '11px', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </label>
          {isMissing && !isSecondary && (
            <span style={{ fontSize: '11px', fontWeight: '600', color: theme.warning }}>
              ⚠️ Sin detectar
            </span>
          )}
        </div>
        {key === 'currency' ? (
          <div style={{ position: 'relative' }}>
            <input list="currencies" className="triage-input" value={val ?? ''} onChange={(e) => handleFieldChange(key, e.target.value)} style={inputStyle} placeholder="EUR, USD, etc." />
            <datalist id="currencies">{CURRENCY_OPTIONS.map(c => <option key={c} value={c} />)}</datalist>
          </div>
        ) : (
          <input 
            type={['subtotal', 'tax_amount', 'total_amount'].includes(key) ? "number" : "text"} 
            step="0.01"
            className="triage-input"
            value={val ?? ''} 
            onChange={(e) => handleFieldChange(key, e.target.value)} 
            style={{
              ...inputStyle,
              borderColor: (isMissing && !isSecondary) ? theme.warning : theme.border
            }} 
            placeholder={`Introduce ${label.toLowerCase()}...`}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 120px)', 
      backgroundColor: theme.bg,
      borderRadius: theme.radius,
      overflow: 'hidden',
      boxShadow: theme.shadow,
      border: `1px solid ${theme.border}`,
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .triage-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
        }
      `}</style>
      
      {/* Header Toolbar */}
      <div style={{ 
        padding: '14px 28px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="apple-btn" onClick={() => safeNavigate(`/batch/${invoice.batch_id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: theme.accent, fontWeight: '700', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
            ← Volver al Lote
          </button>
          <div style={{ height: '20px', width: '1px', backgroundColor: theme.border }}></div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: theme.textSecondary }}>
            Documento <span style={{ color: theme.text }}>{currentIndex + 1}</span> de <span style={{ color: theme.text }}>{batchInvoices.length}</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {prevInvoice && (
            <button className="apple-btn" onClick={() => safeNavigate(`/triage/${prevInvoice.id}`)} style={{ ...buttonStyle(), border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text }}>
              Anterior
            </button>
          )}
          <button 
            className="apple-btn" 
            onClick={() => handleSave(true)}
            style={{ 
              ...buttonStyle(),
              backgroundColor: nextInvoice ? theme.accent : theme.success, 
              color: '#FFF', 
              boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)',
              padding: '10px 24px'
            }}
          >
            {nextInvoice ? 'Guardar y Siguiente ➔' : 'Finalizar Lote ✅'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* PDF Viewer */}
        <div style={{ flex: 1.2, backgroundColor: theme.bg, position: 'relative', borderRight: `1px solid ${theme.border}` }}>
          {pdfUrl ? (
            <iframe src={pdfUrl} width="100%" height="100%" title="Invoice" style={{ border: 'none' }} />
          ) : (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: theme.textSecondary, fontWeight: '600' }}>Cargando vista previa del documento...</div>
          )}
        </div>

        {/* Editor Side */}
        <div style={{ flex: 0.8, padding: '36px', overflowY: 'auto', backgroundColor: theme.surface }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '700', letterSpacing: '-0.03em', color: theme.text }}>Verificación de Datos</h2>
            <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary, fontWeight: '500' }}>{invoice.original_filename}</p>
          </div>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. Campos Activos en el Mapeo ERP */}
            {activeFieldKeys.map(key => renderSingleField(key, false))}

            {/* 2. Campos Inactivos / Secundarios (No exportados a ERP) */}
            {inactiveFieldKeys.length > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px dashed ${theme.border}` }}>
                <button
                  type="button"
                  onClick={() => setShowSecondaryFields(!showSecondaryFields)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: theme.textSecondary,
                    fontWeight: '700',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: showSecondaryFields ? '16px' : '0'
                  }}
                >
                  {showSecondaryFields ? '▼ Ocultar Campos No Exportados' : '▶ Ver Campos Adicionales (No Incluidos en Mapeo ERP)'}
                </button>

                {showSecondaryFields && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {inactiveFieldKeys.map(key => renderSingleField(key, true))}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Triage;
