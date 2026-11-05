import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function Cancel() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <div style={{
        fontSize: '64px',
        marginBottom: '20px'
      }}>
        💳
      </div>

      <h2 style={{
        fontSize: '28px',
        fontWeight: '800',
        letterSpacing: '-0.03em',
        margin: '0 0 12px 0',
        color: 'var(--text)'
      }}>
        {t.misc.cancelTitle}
      </h2>

      <p style={{
        color: 'var(--text-sec)',
        fontSize: '15px',
        maxWidth: '460px',
        lineHeight: '1.6',
        margin: '0 0 32px 0'
      }}>
        {t.misc.cancelDesc}
      </p>

      <button
        className="apple-btn"
        onClick={() => navigate('/')}
        style={{
          padding: '14px 32px',
          backgroundColor: 'var(--accent)',
          color: '#FFF',
          border: 'none',
          borderRadius: '12px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 122, 255, 0.25)'
        }}
      >
        {t.misc.backToApp}
      </button>
    </div>
  );
}

export default Cancel;
