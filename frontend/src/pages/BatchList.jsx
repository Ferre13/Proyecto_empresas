import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

function BatchList() {
  const [batches, setBatches] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const navigate = useNavigate();

  const fetchBatches = async () => {
    try {
      const res = await api.get('/upload/batches');
      setBatches(res.data);
    } catch (err) {
      console.error("Error loading batches", err);
    }
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setShowDeleteModal(id);
  };

  const confirmDelete = async () => {
    if (!showDeleteModal) return;
    try {
      await api.delete(`/upload/batches/${showDeleteModal}`);
      setBatches(batches.filter(b => b.id !== showDeleteModal));
      setShowDeleteModal(null);
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || err.message));
    }
  };

  useEffect(() => {
    fetchBatches();
    const interval = setInterval(fetchBatches, 5000);
    return () => clearInterval(interval);
  }, []);

  const cardStyle = {
    background: theme.surface,
    padding: '20px 24px',
    borderRadius: theme.radiusSmall,
    border: `1px solid ${theme.border}`,
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'COMPLETED': return 'Completado';
      case 'NEEDS_REVIEW': return 'Requiere Revisión';
      case 'FAILED': return 'Error de Procesamiento';
      case 'PROCESSING': return 'Procesando con IA...';
      default: return 'En Cola';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETED': return theme.success;
      case 'NEEDS_REVIEW': return theme.warning;
      case 'FAILED': return theme.error;
      default: return theme.accent;
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', letterSpacing: '-0.03em', margin: '0 0 6px 0' }}>Historial de Lotes</h2>
          <p style={{ color: theme.textSecondary, fontSize: '14px', margin: 0 }}>Historial de procesamientos de facturas por lotes</p>
        </div>
        <span style={{ color: theme.textSecondary, fontSize: '14px', fontWeight: '500' }}>{batches.length} lotes totales</span>
      </div>

      {batches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', color: theme.textSecondary, backgroundColor: theme.surface, borderRadius: theme.radiusSmall, border: `1px solid ${theme.border}` }}>
          <p style={{ fontSize: '16px', margin: 0 }}>No hay lotes procesados todavía. Comienza subiendo facturas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {batches.map(batch => {
            const statusColor = getStatusColor(batch.status);
            const statusLabel = getStatusLabel(batch.status);
            return (
              <div 
                key={batch.id} 
                className="apple-card clickable-card" 
                style={cardStyle}
                onClick={() => navigate(`/batch/${batch.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: '600',
                    color: statusColor,
                    backgroundColor: `${statusColor}15`,
                    border: `1px solid ${statusColor}30`
                  }}>
                    {statusLabel}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: theme.text }}>
                      Lote de Facturas
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary }}>
                      {new Date(batch.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: theme.accent }}>
                    Ver lote ➔
                  </span>
                  <button 
                    onClick={(e) => handleDeleteClick(e, batch.id)}
                    style={{ 
                      background: 'none',
                      border: 'none',
                      color: theme.textSecondary,
                      cursor: 'pointer',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.error}
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
                    title="Eliminar Lote"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }} onClick={() => setShowDeleteModal(null)}>
          <div 
            style={{
              background: theme.surface,
              padding: '32px',
              borderRadius: theme.radius,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              maxWidth: '360px',
              width: '90%',
              textAlign: 'center',
              border: `1px solid ${theme.border}`
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600' }}>Confirm Deletion</h3>
            <p style={{ margin: '0 0 24px 0', color: theme.textSecondary, fontSize: '15px', lineHeight: 1.4 }}>
              Are you sure you want to permanently delete this batch? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="apple-btn" onClick={() => setShowDeleteModal(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: 'transparent', color: theme.text, cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button className="apple-btn" onClick={confirmDelete} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: theme.error, color: '#fff', cursor: 'pointer', fontWeight: '600' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BatchList;
