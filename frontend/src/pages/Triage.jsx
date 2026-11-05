import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { FALLBACK_ERP_TEMPLATES } from './Mapping';
import { resolveConfigForErp, isPlaceholderOrEmpty } from './BatchDetail';

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
  'retention_amount',
  'total_amount',
  'currency'
];

const CURRENCY_OPTIONS = ['EUR', 'USD', 'GBP', 'JPY', 'CNY', 'MXN', 'BRL', 'CAD', 'AUD', 'CHF'];

function Triage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [invoice, setInvoice] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [filePreview, setFilePreview] = useState({ url: null, isPdf: true, isImage: false });
  const [batchInvoices, setBatchInvoices] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  const [savedMappings, setSavedMappings] = useState([]);
  const [activeErpName, setActiveErpName] = useState(() => localStorage.getItem('docuflow_active_erp') || 'QuickBooks Online');
  const [activeFieldKeys, setActiveFieldKeys] = useState(ALL_EDITABLE_FIELDS);
  const [inactiveFieldKeys, setInactiveFieldKeys] = useState([]);
  const [showSecondaryFields, setShowSecondaryFields] = useState(false);
  const [manualValidOverride, setManualValidOverride] = useState(false);

  const applyErpConfigFields = (config) => {
    if (config && typeof config === 'object' && Object.keys(config).length > 0) {
      const mappedCanonicalIds = Object.values(config);
      const activeList = ['is_valid_invoice', ...mappedCanonicalIds.filter(id => id !== 'is_valid_invoice')];
      const inactiveList = ALL_EDITABLE_FIELDS.filter(id => id !== 'is_valid_invoice' && !mappedCanonicalIds.includes(id));
      setActiveFieldKeys(activeList);
      setInactiveFieldKeys(inactiveList);
    } else {
      setActiveFieldKeys(ALL_EDITABLE_FIELDS);
      setInactiveFieldKeys([]);
    }
  };

  useEffect(() => {
    let createdUrl = null;

    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/invoices/${invoiceId}`);
        setInvoice(res.data);

        const rawData = res.data.extracted_data || {};
        const cleanedData = {};
        Object.keys(rawData).forEach(k => {
          if (typeof rawData[k] === 'boolean' || typeof rawData[k] === 'number' || Array.isArray(rawData[k])) {
            cleanedData[k] = rawData[k];
          } else {
            cleanedData[k] = isPlaceholderOrEmpty(rawData[k]) ? '' : rawData[k];
          }
        });
        setFormData(cleanedData);
        setIsDirty(false);
        setManualValidOverride(false);

        const batchRes = await api.get(`/upload/batches/${res.data.batch_id}/invoices`);
        setBatchInvoices(batchRes.data);

        const filename = res.data.original_filename || '';
        const isPdf = filename.toLowerCase().endsWith('.pdf');
        const isImage = /\.(jpe?g|png|webp|gif)$/i.test(filename);

        const fileRes = await api.get(`/invoices/${invoiceId}/file`, { responseType: 'blob' });
        const mimeType = isPdf ? 'application/pdf' : (fileRes.headers['content-type'] || 'image/jpeg');
        createdUrl = window.URL.createObjectURL(new Blob([fileRes.data], { type: mimeType }));
        setFilePreview({ url: createdUrl, isPdf, isImage });
      } catch (err) {
        setError(t.triage.loadError);
      }
    };

    const fetchMappingConfig = async () => {
      try {
        const res = await api.get('/mappings/');
        const list = Array.isArray(res.data) ? res.data : [];
        setSavedMappings(list);

        const storedErp = localStorage.getItem('docuflow_active_erp');
        const selectedErp = storedErp || (list.length > 0 ? list[0].erp_name : 'QuickBooks Online');
        setActiveErpName(selectedErp);

        const resolvedConfig = resolveConfigForErp(selectedErp, list) || (list[0]?.config);
        applyErpConfigFields(resolvedConfig);
      } catch (e) {
        const fallbackConfig = resolveConfigForErp(activeErpName, []);
        applyErpConfigFields(fallbackConfig);
      }
    };

    fetchInvoice();
    fetchMappingConfig();

    return () => {
      if (createdUrl) {
        window.URL.revokeObjectURL(createdUrl);
      }
    };
  }, [invoiceId]);

  const handleSwitchErpInTriage = async (newErp) => {
    setActiveErpName(newErp);
    localStorage.setItem('docuflow_active_erp', newErp);
    setManualValidOverride(false);
    const resolvedConfig = resolveConfigForErp(newErp, savedMappings);
    applyErpConfigFields(resolvedConfig);
    try {
      await api.post('/mappings/activate', {
        erp_name: newErp,
        batch_id: invoice?.batch_id
      });
    } catch (e) {}
  };

  const currentIndex = batchInvoices.findIndex(inv => inv.id === invoiceId);
  const prevInvoice = currentIndex > 0 ? batchInvoices[currentIndex - 1] : null;
  const nextInvoice = currentIndex < batchInvoices.length - 1 ? batchInvoices[currentIndex + 1] : null;

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const missingActiveFields = activeFieldKeys.filter(
    k => k !== 'is_valid_invoice' && k !== 'retention_amount' && isPlaceholderOrEmpty(formData[k])
  );
  const isEffectiveValid = manualValidOverride
    ? Boolean(formData.is_valid_invoice)
    : (formData.ai_is_valid_document !== false && missingActiveFields.length === 0);

  const handleSave = async (andNavigate = false) => {
    try {
      const updatedData = {
        ...formData,
        is_valid_invoice: isEffectiveValid
      };
      const updatedStatus = isEffectiveValid ? 'VALIDATED' : 'NEEDS_REVIEW';
      await api.put(`/invoices/${invoiceId}`, {
        extracted_data: updatedData,
        status: updatedStatus
      });
      setIsDirty(false);
      if (andNavigate) {
        if (nextInvoice) {
          navigate(`/app/triage/${nextInvoice.id}`);
        } else {
          navigate(`/app/batch/${invoice.batch_id}`);
        }
      }
    } catch (err) {
      alert(t.triage.saveError);
    }
  };

  const safeNavigate = (targetPath) => {
    if (isDirty) {
      if (window.confirm(t.triage.unsavedChanges)) {
        navigate(targetPath);
      }
    } else {
      navigate(targetPath);
    }
  };

  if (error) return <div style={{ color: theme.error, padding: '40px', textAlign: 'center' }}>{error}</div>;
  if (!invoice) return (
    <div style={{ padding: '60px', textAlign: 'center', color: theme.textSecondary }}>
      {t.triage.loadingDoc}
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
    const label = t.triage.fields?.[key] || key;
    const val = formData[key];
    const isMissing = isPlaceholderOrEmpty(val);

    if (key === 'is_valid_invoice') {
      const isValid = isEffectiveValid;
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
            <div style={{ fontWeight: '700', fontSize: '14px', color: theme.text }}>{t.triage.validityTitle}</div>
            <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '2px' }}>
              {isValid ? t.triage.validityOk : t.triage.validityReview}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
            <input
              type="checkbox"
              checked={isValid}
              onChange={(e) => {
                setManualValidOverride(true);
                handleFieldChange(key, e.target.checked);
              }}
              style={{ width: '18px', height: '18px', accentColor: theme.success }}
            />
            {t.triage.validCheckbox}
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
          {isMissing && !isSecondary && key !== 'retention_amount' && (
            <span style={{ fontSize: '11px', fontWeight: '600', color: theme.warning }}>
              {t.triage.missingBadge}
            </span>
          )}
        </div>
        {key === 'currency' ? (
          <div style={{ position: 'relative' }}>
            <input list="currencies" className="triage-input" value={val ?? ''} onChange={(e) => handleFieldChange(key, e.target.value)} style={inputStyle} placeholder="EUR, USD, GBP..." />
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
              borderColor: (isMissing && !isSecondary && key !== 'retention_amount') ? theme.warning : theme.border
            }}
            placeholder={`${t.triage.enterPlaceholder} ${label.toLowerCase()}...`}
          />
        )}
      </div>
    );
  };

  const erpOptions = [
    ...savedMappings.map(m => ({ label: `☁️ ${m.erp_name}`, value: m.erp_name })),
    ...FALLBACK_ERP_TEMPLATES
      .filter(tpl => !savedMappings.some(s => s.erp_name.toLowerCase() === tpl.erp_name.toLowerCase()))
      .map(tpl => ({ label: `${tpl.badge} ${tpl.erp_name}`, value: tpl.erp_name }))
  ];

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
        zIndex: 10,
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button className="apple-btn" onClick={() => safeNavigate(`/app/batch/${invoice.batch_id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: theme.accent, fontWeight: '700', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {t.triage.backToBatch}
          </button>
          <div style={{ height: '20px', width: '1px', backgroundColor: theme.border }}></div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: theme.textSecondary }}>
            {t.triage.docCounter} <span style={{ color: theme.text }}>{currentIndex + 1}</span> {t.triage.of} <span style={{ color: theme.text }}>{batchInvoices.length}</span>
          </span>
          <div style={{ height: '20px', width: '1px', backgroundColor: theme.border }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg)', padding: '4px 10px', borderRadius: '10px', border: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: theme.textSecondary }}>ERP:</span>
            <select
              value={activeErpName}
              onChange={(e) => handleSwitchErpInTriage(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: theme.text,
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {erpOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {prevInvoice && (
            <button className="apple-btn" onClick={() => safeNavigate(`/app/triage/${prevInvoice.id}`)} style={{ ...buttonStyle(), border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text }}>
              {t.triage.prev}
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
            {nextInvoice ? t.triage.saveAndNext : t.triage.finishBatch}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1.2, backgroundColor: 'rgba(0,0,0,0.03)', position: 'relative', borderRight: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
          {filePreview.url ? (
            filePreview.isImage ? (
              <div style={{ width: '100%', height: '100%', padding: '24px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={filePreview.url}
                  alt="Invoice"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    border: `1px solid ${theme.border}`
                  }}
                />
              </div>
            ) : (
              <iframe src={filePreview.url} width="100%" height="100%" title="Invoice" style={{ border: 'none' }} />
            )
          ) : (
            <div style={{ color: theme.textSecondary, fontWeight: '600' }}>{t.triage.loadingPreview}</div>
          )}
        </div>

        <div style={{ flex: 0.8, padding: '36px', overflowY: 'auto', backgroundColor: theme.surface }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '700', letterSpacing: '-0.03em', color: theme.text }}>{t.triage.dataVerification}</h2>
            <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary, fontWeight: '500' }}>{invoice.original_filename}</p>
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {activeFieldKeys.map(key => renderSingleField(key, false))}

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
                  {showSecondaryFields ? t.triage.hideSecondary : t.triage.showSecondary}
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
