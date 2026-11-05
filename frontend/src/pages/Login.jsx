import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/app/upload';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t.auth.fillAllFields);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || t.auth.loginError);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '15px',
    boxSizing: 'border-box',
    marginBottom: '16px'
  };

  return (
    <div style={{
      maxWidth: '420px',
      margin: '40px auto',
      padding: '36px 32px',
      backgroundColor: 'var(--surface)',
      borderRadius: '20px',
      border: '1px solid var(--border)',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.08)',
      animation: 'fadeIn 0.4s ease-out'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #007AFF, #5856D6)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFF',
          fontWeight: '800',
          fontSize: '18px',
          marginBottom: '12px'
        }}>
          D
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', margin: '0 0 6px 0', color: 'var(--text)' }}>
          {t.auth.loginTitle}
        </h2>
        <p style={{ color: 'var(--text-sec)', fontSize: '14px', margin: 0 }}>
          {t.auth.loginSubtitle}
        </p>
      </div>

      {error && (
        <div style={{
          padding: '12px 14px',
          backgroundColor: 'rgba(255, 59, 48, 0.08)',
          color: 'var(--error)',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: '500',
          marginBottom: '20px',
          border: '1px solid rgba(255, 59, 48, 0.2)'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>
            {t.auth.emailLabel}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.auth.emailPlaceholder}
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>
            {t.auth.passwordLabel}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
            required
          />
        </div>

        <button
          type="submit"
          className="apple-btn"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: 'var(--accent)',
            color: '#FFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: submitting ? 'default' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(0, 122, 255, 0.25)',
            marginBottom: '16px'
          }}
        >
          {submitting ? t.auth.loggingIn : t.auth.loginBtn}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-sec)', marginTop: '20px' }}>
        {t.auth.noAccount}{' '}
        <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
          {t.auth.registerLink}
        </Link>
      </div>
    </div>
  );
}

export default Login;
