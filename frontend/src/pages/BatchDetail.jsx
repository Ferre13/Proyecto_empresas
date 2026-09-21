import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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

function BatchDetail() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [erpName, setErpName] = useState('Excel / CSV');

  const fetchInvoices = async () => {
    try {
      const res = await api.get(`/upload/batches/${batchId}/invoices`);
      setInvoices(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchInvoices();
    const interval = setInterval(fetchInvoices, 3000);
    return () => clearInterval(interval);
  }, [batchId]);

  const handleDownload = async () => {
    try {
      const response = await api.get(`/mappings/export/${batchId}?erp_name=${encodeURIComponent(erpName)}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Batch_${batchId.slice(0, 8)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      if (err.response && err.response.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          alert(`Error al exportar: ${json.detail || 'Comprueba que haya facturas en este lote.'}`);
          return;
        } catch (e) {}
      }
      alert("No hay facturas procesadas para exportar en este lote.");
    }
  };

  const handleRetry = async (e, invoiceId) => {
    e.stopPropagation();
    try {
      await api.post(`/invoices/${invoiceId}/retry`);
      fetchInvoices();
    } catch (err) { alert(err.message); }
  };

  const getReviewUrl = () => {
    const unvalidated = invoices.find(inv => inv.status !== 'VALIDATED');
    return unvalidated ? `/triage/${unvalidated.id}` : null;
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
    padding: '12px 20px',
    backgroundColor: bg,
    color: '#FFF',
    border: 'none',
    borderRadius: theme.radiusSmall,
    cursor: disabled ? 'default' : 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: disabled ? 0.4 : 1,
    pointerEvents: disabled ? 'none' : 'auto'
  });

  const getBadgeInfo = (inv) => {
    if (inv.is_valid_invoice === false) {
      return { label: 'Revisión Necesaria', color: theme.warning };
    }
    switch (inv.status) {
      case 'VALIDATED': return { label: 'Validada', color: theme.success };
      case 'NEEDS_REVIEW': return { label: 'Requiere Revisión', color: theme.warning };
      case 'FAILED': return { label: 'Error', color: theme.error };
      default: return { label: 'Procesando...', color: theme.accent };
    }
  };

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
        <div>
          <Link to="/batches" style={{ color: theme.accent, textDecoration: 'none', fontSize: '14px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
            ← Volver a Lotes
          </Link>
          <h2 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.03em', margin: 0, color: theme.text }}>
            Detalle del Lote
          </h2>
          <p style={{ margin: '4px 0 0 0', color: theme.textSecondary, fontSize: '14px' }}>
            {invoices.length} documento{invoices.length !== 1 ? 's' : ''} en este lote
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {getReviewUrl() && (
            <Link to={getReviewUrl()} className="apple-btn" style={buttonStyle(false, theme.warning)}>
              🔍 Revisar Pendientes
            </Link>
          )}
          <button className="apple-btn" onClick={handleDownload} style={buttonStyle(invoices.length === 0, theme.accent)}>
            📥 Exportar a Excel/CSV
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
              onClick={() => navigate(`/triage/${inv.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '20px' }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inv.original_filename}
                  </h4>
                  <span style={{ fontSize: '12px', color: theme.textSecondary, fontWeight: '500' }}>
                    {new Date(inv.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                    Reintentar 🔄
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
