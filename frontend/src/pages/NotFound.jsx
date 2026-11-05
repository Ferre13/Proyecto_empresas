import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function NotFound() {
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
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔍</div>
      <h2 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.03em', margin: '0 0 10px 0', color: 'var(--text)' }}>
        {t.misc.notFoundTitle}
      </h2>
      <p style={{ color: 'var(--text-sec)', fontSize: '15px', maxWidth: '420px', lineHeight: '1.6', margin: '0 0 28px 0' }}>
        {t.misc.notFoundDesc}
      </p>
      <button
        className="apple-btn"
        onClick={() => navigate('/')}
        style={{
          padding: '12px 28px',
          backgroundColor: 'var(--accent)',
          color: '#FFF',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        {t.misc.goHome}
      </button>
    </div>
  );
}

export default NotFound;
