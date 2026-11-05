import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

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

function Upload() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('');
  const [batchId, setBatchId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { billingStatus, refreshBilling } = useAuth();

  const handleUpload = async () => {
    if (files.length === 0) return;
    const formData = new FormData();
    for (let file of files) {
      formData.append('files', file);
    }

    try {
      setStatus('Enviando documentos...');
      const response = await api.post('/upload/', formData);
      setBatchId(response.data.batch_id);
      setStatus(`Procesamiento iniciado. ID de Lote: ${response.data.batch_id}`);
      setNeedsSubscription(false);
      refreshBilling();
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setNeedsSubscription(true);
        setStatus(error.response?.data?.detail || 'Se requiere una suscripción activa para procesar documentos.');
      } else {
        setStatus('Error al subir los archivos. Por favor, inténtalo de nuevo.');
      }
    }
  };

  const handleSubscribe = async () => {
    try {
      setStatus('Redirigiendo a Stripe Checkout seguro...');
      const response = await api.post('/billing/create-checkout-session');
      window.location.href = response.data.url;
    } catch (error) {
      setStatus('Error al conectar con la pasarela de pagos Stripe.');
    }
  };

  const handleManageBilling = async () => {
    try {
      setStatus('Abriendo Portal de Facturación de Stripe...');
      const response = await api.post('/billing/create-portal-session');
      window.location.href = response.data.url;
    } catch (error) {
      if (error.response && error.response.status === 400) {
        handleSubscribe();
      } else {
        setStatus('No se pudo abrir el portal de facturación.');
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(e.dataTransfer.files);
    }
  };

  const cardStyle = {
    background: theme.surface,
    padding: '32px',
    borderRadius: theme.radius,
    boxShadow: theme.shadow,
    marginBottom: '32px',
    border: `1px solid ${theme.border}`,
  };

  const buttonStyle = (disabled = false) => ({
    padding: '14px 28px',
    backgroundColor: theme.accent,
    color: '#FFF',
    border: 'none',
    borderRadius: theme.radiusSmall,
    cursor: disabled ? 'default' : 'pointer',
    fontWeight: '600',
    fontSize: '16px',
    letterSpacing: '-0.01em',
    display: 'inline-block',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: disabled ? 0.4 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    boxShadow: disabled ? 'none' : '0 4px 12px rgba(0, 122, 255, 0.2)'
  });

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .upload-zone {
          border: 2px dashed var(--border);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          background-color: var(--bg);
        }
        .upload-zone:hover {
          border-color: var(--accent);
          background-color: rgba(0, 122, 255, 0.03);
          transform: translateY(-2px);
        }
        .upload-zone.dragging {
          border-color: var(--accent);
          background-color: rgba(0, 122, 255, 0.08);
          transform: scale(1.02);
          box-shadow: 0 8px 24px rgba(0, 122, 255, 0.1);
        }
        .apple-btn:hover:not(:disabled) {
          filter: brightness(1.08);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 122, 255, 0.25);
        }
        .apple-btn:active:not(:disabled) {
          transform: translateY(0);
          filter: brightness(0.95);
        }
      `}</style>
      
      {/* Banner de Estado de Prueba / Suscripción */}
      {billingStatus?.is_trial && (
        <div style={{
          padding: '14px 20px',
          backgroundColor: 'rgba(0, 122, 255, 0.06)',
          border: '1px solid rgba(0, 122, 255, 0.2)',
          borderRadius: theme.radiusSmall,
          marginBottom: '24px',
          fontSize: '14px',
          color: theme.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <span>🎁 <strong>Periodo de Prueba Activo:</strong> Te quedan </span>
            <strong style={{ fontSize: '15px' }}>{billingStatus.trial_remaining}</strong>
            <span> de {billingStatus.trial_limit} facturas gratuitas para probar.</span>
          </div>
          <button
            onClick={() => navigate('/app/settings')}
            style={{
              background: 'none',
              border: 'none',
              color: theme.accent,
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '13px'
            }}
          >
            Activar Plan Pro ➔
          </button>
        </div>
      )}

      {/* Upload Section */}
      <div style={{ ...cardStyle }}>
        <div style={{ marginBottom: '8px' }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.03em', color: theme.text }}>
            Subida y Procesamiento de Facturas
          </h2>
          <p style={{ color: theme.textSecondary, fontSize: '15px', margin: 0, lineHeight: '1.5' }}>
            La IA extraerá automáticamente todos los datos contables y verificará la integridad matemática de cada documento.
          </p>
        </div>
        
        <input 
          type="file" 
          multiple 
          ref={fileInputRef}
          onChange={(e) => setFiles(e.target.files)}
          style={{ display: 'none' }}
        />

        <div 
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          style={{ 
            padding: '64px 32px', 
            borderRadius: theme.radius, 
            textAlign: 'center',
            margin: '24px 0 28px 0',
            borderStyle: 'dashed',
            borderWidth: '2px'
          }}
        >
          <div style={{ fontSize: '52px', marginBottom: '16px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))' }}>📄</div>
          <p style={{ color: theme.text, fontWeight: '700', fontSize: '18px', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
            {files.length > 0 ? `${files.length} documento${files.length > 1 ? 's' : ''} seleccionado${files.length > 1 ? 's' : ''}` : 'Arrastra aquí tus facturas'}
          </p>
          <p style={{ color: theme.textSecondary, fontSize: '14px', margin: 0, opacity: 0.8 }}>
            Soporta PDF, imágenes (JPG, PNG) o archivos comprimidos (ZIP)
          </p>
          
          <div style={{ marginTop: '24px' }}>
            <span className="apple-btn" style={{ ...buttonStyle(), pointerEvents: 'none', padding: '10px 24px', fontSize: '14px' }}>
              Seleccionar archivos
            </span>
          </div>
        </div>
        
        <button 
          className="apple-btn" 
          onClick={handleUpload} 
          style={{ ...buttonStyle(files.length === 0), width: '100%', height: '52px' }}
          disabled={files.length === 0}
        >
          {files.length === 0 ? 'Selecciona documentos para comenzar' : `Procesar ${files.length} Factura${files.length > 1 ? 's' : ''}`}
        </button>
        
        {status && (
          <div style={{ 
            marginTop: '20px', 
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: status.includes('Error') || status.includes('fallado') || needsSubscription ? 'rgba(255, 59, 48, 0.05)' : 'rgba(0, 122, 255, 0.05)',
            color: status.includes('Error') || status.includes('fallado') || needsSubscription ? theme.error : theme.accent,
            fontSize: '14px', 
            fontWeight: '600',
            textAlign: 'center',
            border: `1px solid ${status.includes('Error') || status.includes('fallado') || needsSubscription ? 'rgba(255, 59, 48, 0.1)' : 'rgba(0, 122, 255, 0.1)'}`
          }}>
            {status}
          </div>
        )}

        {needsSubscription && (
          <div style={{ marginTop: '16px' }}>
            <button
              className="apple-btn"
              onClick={handleSubscribe}
              style={{ 
                ...buttonStyle(), 
                backgroundColor: theme.success, 
                width: '100%', 
                height: '48px', 
                fontSize: '15px',
                color: '#FFF',
                boxShadow: '0 4px 12px rgba(52, 199, 89, 0.25)'
              }}
            >
              🚀 Activar Suscripción con Stripe (Checkout)
            </button>
          </div>
        )}
      </div>
      
      {batchId && (
        <div style={{ 
          marginTop: '20px',
          padding: '20px', 
          borderRadius: theme.radiusSmall, 
          backgroundColor: theme.surface,
          color: theme.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: `1px solid ${theme.border}`,
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>⚡</span>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px' }}>Lote enviado correctamente</div>
              <div style={{ color: theme.textSecondary, fontSize: '13px' }}>El worker de IA está procesando los documentos en segundo plano.</div>
            </div>
          </div>
          <button 
            className="apple-btn"
            onClick={() => navigate(`/app/batch/${batchId}`)}
            style={{ ...buttonStyle(), padding: '10px 20px', fontSize: '14px' }}
          >
            Ver estado del Lote
          </button>
        </div>
      )}
    </div>
  );
}

export default Upload;
