import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { FALLBACK_ERP_TEMPLATES } from './Mapping';

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

function BatchDetail() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [invoices, setInvoices] = useState([]);
  const [erpName, setErpName] = useState('QuickBooks Online');
  const [savedMappings, setSavedMappings] = useState([]);

  const fetchInvoices = async () => {
    try {
      const res = await api.get(`/upload/batches/${batchId}/invoices`);
      setInvoices(res.data);
      const isStillProcessing = res.data.some(inv => inv.status === 'PENDING' || inv.status === 'PROCESSING');
      return isStillProcessing;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const res = await api.get('/mappings/');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setSavedMappings(res.data);
          setErpName(res.data[0].erp_name);
        }
      } catch (e) {}
    };
    fetchMappings();
  }, []);

  useEffect(() => {
    fetchInvoices();
    const interval = setInterval(async () => {
      const keepPolling = await fetchInvoices();
      if (!keepPolling) {
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [batchId]);

  const handleDownload = async (format = 'xlsx') => {
    try {
      const response = await api.get(
        `/mappings/export/${batchId}?erp_name=${encodeURIComponent(erpName)}&format=${format}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const ext = format === 'csv' ? 'csv' : 'xlsx';
      const safeErp = erpName.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `${safeErp}_Batch_${batchId.slice(0, 8)}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      if (err.response && err.response.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          alert(json.detail || t.batchDetail.noInvoicesExport);
          return;
        } catch (e) {}
      }
      alert(t.batchDetail.noInvoicesExport);
    }
  };

  const handleRetry = async (e, invoiceId) => {
    e.stopPropagation();
    try {
      await api.post(`/invoices/${invoiceId}/retry`);
      fetchInvoices();
    } catch (err) {
      alert(err.message);
    }
  };

  const getReviewUrl = () => {
    const unvalidated = invoices.find(inv => inv.status !== 'VALIDATED');
    return unvalidated ? `/app/triage/${unvalidated.id}` : null;
  };

  const cardStyle = {
    background: theme.surface,
    padding: '16px 20px',
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const buttonStyle = (disabled, bg) => ({
    padding: '10px 18px',
    backgroundColor: bg,
    color: '#FFF',
    border: 'none',
    borderRadius: theme.radiusSmall,
    cursor: disabled ? 'default' : 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: disabled ? 0.4 : 1,
    pointerEvents: disabled ? 'none' : 'auto'
  });

  const getBadgeInfo = (inv) => {
    if (inv.is_valid_invoice === false) {
      return { label: t.batchDetail.statusNeedsReview, color: theme.warning };
    }
    switch (inv.status) {
      case 'VALIDATED': return { label: t.batchDetail.statusValidated, color: theme.success };
      case 'NEEDS_REVIEW': return { label: t.batchDetail.statusNeedsReview, color: theme.warning };
      case 'FAILED': return { label: t.batchDetail.statusFailed, color: theme.error };
      default: return { label: t.batchDetail.statusProcessing, color: theme.accent };
    }
  };

  // Combinar mapeos guardados del usuario + plantillas oficiales sin duplicar
  const erpOptions = [
    ...savedMappings.map(m => ({ label: `☁️ ${m.erp_name}`, value: m.erp_name })),
    ...FALLBACK_ERP_TEMPLATES
      .filter(tpl => !savedMappings.some(s => s.erp_name.toLowerCase() === tpl.erp_name.toLowerCase()))
      .map(tpl => ({ label: `${tpl.badge} ${tpl.erp_name}`, value: tpl.erp_name }))
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .apple-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
          border-color: var(--accent);
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Link to="/app/batches" style={{ color: theme.accent, textDecoration: 'none', fontSize: '14px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
            {t.batchDetail.backToBatches}
          </Link>
          <h2 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.03em', margin: 0, color: theme.text }}>
            {t.batchDetail.title}
          </h2>
          <p style={{ margin: '4px 0 0 0', color: theme.textSecondary, fontSize: '14px' }}>
            {invoices.length} {t.batchDetail.docsInBatch}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {getReviewUrl() && (
            <Link to={getReviewUrl()} className="apple-btn" style={buttonStyle(false, theme.warning)}>
              {t.batchDetail.reviewPending}
            </Link>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: theme.surface, padding: '6px 10px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: theme.textSecondary }}>
              {t.batchDetail.exportFormatLabel}
            </span>
            <select
              value={erpName}
              onChange={(e) => setErpName(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: theme.text,
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {erpOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button className="apple-btn" onClick={() => handleDownload('xlsx')} style={buttonStyle(invoices.length === 0, theme.accent)}>
            {t.batchDetail.exportExcel}
          </button>
          <button
            className="apple-btn"
            onClick={() => handleDownload('csv')}
            style={{
              ...buttonStyle(invoices.length === 0, theme.surface),
              color: theme.text,
              border: `1px solid ${theme.border}`
            }}
          >
            {t.batchDetail.exportCsv}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {invoices.map(inv => {
          const badge = getBadgeInfo(inv);

          return (
            <div
              key={inv.id}
              className="apple-card"
              style={cardStyle}
              onClick={() => navigate(`/app/triage/${inv.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '20px' }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inv.original_filename}
                  </h4>
                  <span style={{ fontSize: '12px', color: theme.textSecondary, fontWeight: '500' }}>
                    {new Date(inv.created_at).toLocaleString(lang, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: badge.color,
                  backgroundColor: `${badge.color}15`,
                  border: `1px solid ${badge.color}30`,
                  whiteSpace: 'nowrap'
                }}>
                  {badge.label}
                </div>

                {(inv.status === 'FAILED' || inv.status === 'PROCESSING') && (
                  <button onClick={(e) => handleRetry(e, inv.id)} style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: '12px', fontWeight: '600', padding: '4px 8px' }}>
                    {t.batchDetail.retry}
                  </button>
                )}

                <span style={{ fontSize: '14px', color: theme.accent, fontWeight: '700' }}>➔</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BatchDetail;
