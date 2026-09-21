import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

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
        fontSize: '72px',
        marginBottom: '24px',
        filter: 'drop-shadow(0 4px 12px rgba(52, 199, 89, 0.3))'
      }}>
        🎉
      </div>

      <h2 style={{
        fontSize: '32px',
        fontWeight: '800',
        letterSpacing: '-0.03em',
        margin: '0 0 12px 0'
      }}>
        Subscription Activated!
      </h2>

      <p style={{
        color: 'var(--text-sec)',
        fontSize: '16px',
        maxWidth: '480px',
        lineHeight: '1.6',
        margin: '0 0 32px 0'
      }}>
        Thank you for subscribing. Your account has been upgraded and AI document extraction is now unlocked.
      </p>

      {sessionId && (
        <div style={{
          fontSize: '13px',
          color: 'var(--text-sec)',
          backgroundColor: 'var(--surface)',
          padding: '10px 18px',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          marginBottom: '32px'
        }}>
          Session ID: <code style={{ color: 'var(--accent)' }}>{sessionId.slice(0, 24)}...</code>
        </div>
      )}

      <button
        className="apple-btn"
        onClick={() => navigate('/')}
        style={{
          padding: '14px 32px',
          backgroundColor: 'var(--accent)',
          color: '#FFF',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 122, 255, 0.25)'
        }}
      >
        Start Processing Invoices
      </button>
    </div>
  );
}

export default Success;
