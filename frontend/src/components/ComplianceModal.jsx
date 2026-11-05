import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function ComplianceModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('compliance_consent');
      if (!consent) {
        setIsVisible(true);
      }
    } catch (e) {
      console.warn("Storage access restricted:", e);
      setIsVisible(false);
    }
  }, []);

  const saveConsent = (type, analytics = false) => {
    try {
      localStorage.setItem('compliance_consent', JSON.stringify({
        type,
        analytics,
        timestamp: new Date().toISOString()
      }));
    } catch (e) {
      console.warn("Could not save consent:", e);
    }
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    saveConsent('all', true);
  };

  const handleRejectAll = () => {
    saveConsent('necessary', false);
  };

  const handleSaveCustom = () => {
    saveConsent('custom', analyticsConsent);
  };

  if (!isVisible) return null;

  const btnStyle = {
    padding: '10px 18px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '720px',
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '18px',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.15)',
      padding: '24px 28px',
      zIndex: 9999,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      animation: 'fadeIn 0.4s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ fontSize: '28px' }}>🛡️</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>
            Privacidad y Cumplimiento Normativo
          </h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-sec)', lineHeight: '1.5' }}>
            Utilizamos almacenamiento local técnico esencial para garantizar la seguridad de tu sesión (autenticación) y la conexión con Stripe. Puedes consultar todos los detalles en nuestra sección de{' '}
            <Link to="/legal/almacenamiento" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
              Almacenamiento Local
            </Link>{' '}
            y en el{' '}
            <Link to="/legal/proteccion-datos" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
              Acuerdo de Tratamiento de Datos (RGPD)
            </Link>.
          </p>

          {showPreferences && (
            <div style={{
              margin: '16px 0',
              padding: '16px',
              backgroundColor: 'var(--bg)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>Cookies Técnicas (Necesarias)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-sec)' }}>Imprescindibles para autenticación y aislamiento multi-tenant.</div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--success)' }}>Siempre Activas</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>Métricas de Rendimiento</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-sec)' }}>Permite medir la velocidad de respuesta de extracción de IA.</div>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsConsent}
                  onChange={(e) => setAnalyticsConsent(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              className="apple-btn"
              onClick={() => setShowPreferences(!showPreferences)}
              style={{
                ...btnStyle,
                backgroundColor: 'transparent',
                color: 'var(--text-sec)',
                border: '1px solid var(--border)'
              }}
            >
              {showPreferences ? 'Ocultar Opciones' : 'Configurar'}
            </button>
            <button
              className="apple-btn"
              onClick={handleRejectAll}
              style={{
                ...btnStyle,
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--border)'
              }}
            >
              Solo Necesarias
            </button>
            {showPreferences ? (
              <button
                className="apple-btn"
                onClick={handleSaveCustom}
                style={{
                  ...btnStyle,
                  backgroundColor: 'var(--accent)',
                  color: '#FFF'
                }}
              >
                Guardar Selección
              </button>
            ) : (
              <button
                className="apple-btn"
                onClick={handleAcceptAll}
                style={{
                  ...btnStyle,
                  backgroundColor: 'var(--accent)',
                  color: '#FFF'
                }}
              >
                Aceptar Todas
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplianceModal;
