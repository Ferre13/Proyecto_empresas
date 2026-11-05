import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function Register() {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName || !email || !password) {
      setError(t.auth.fillAllFields);
      return;
    }
    if (!acceptedTerms) {
      setError(t.auth.mustAcceptTerms);
      return;
    }
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const data = await register(email, password, companyName);
      if (data?.session) {
        navigate('/app/upload', { replace: true });
      } else {
        setSuccessMsg(t.auth.registerSuccess);
      }
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
      maxWidth: '440px',
      margin: '40px auto',
      padding: '36px 32px',
      backgroundColor: 'var(--surface)',
      borderRadius: '20px',
      border: '1px solid var(--border)',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.08)',
      animation: 'fadeIn 0.4s ease-out'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', margin: '0 0 6px 0', color: 'var(--text)' }}>
          {t.auth.registerTitle}
        </h2>
        <p style={{ color: 'var(--text-sec)', fontSize: '14px', margin: 0 }}>
          {t.auth.registerSubtitle}
        </p>
      </div>

      {successMsg && (
        <div style={{
          padding: '16px',
          backgroundColor: 'rgba(52, 199, 89, 0.1)',
          color: 'var(--success)',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '20px',
          border: '1px solid rgba(52, 199, 89, 0.25)',
          lineHeight: '1.5'
        }}>
          {successMsg}
          <div style={{ marginTop: '12px' }}>
            <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              {t.auth.goToLogin}
            </Link>
          </div>
        </div>
      )}

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
            {t.auth.companyLabel}
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={t.auth.companyPlaceholder}
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>
            {t.auth.corpEmailLabel}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.auth.corpEmailPlaceholder}
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>
            {t.auth.securePasswordLabel}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.auth.passwordMinPlaceholder}
            style={inputStyle}
            minLength={8}
            required
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px' }}>
          <input
            type="checkbox"
            id="terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            style={{ marginTop: '3px', cursor: 'pointer', accentColor: 'var(--accent)' }}
            required
          />
          <label htmlFor="terms" style={{ fontSize: '12px', color: 'var(--text-sec)', lineHeight: '1.4', cursor: 'pointer' }}>
            {t.auth.acceptTermsPrefix}{' '}
            <Link to="/legal/terminos" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              {t.auth.termsLink}
            </Link>{' '}
            {t.auth.andThe}{' '}
            <Link to="/legal/proteccion-datos" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              {t.auth.privacyLink}
            </Link>.
          </label>
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
          {submitting ? t.auth.creatingAccount : t.auth.registerBtn}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-sec)', marginTop: '16px' }}>
        {t.auth.alreadyHaveAccount}{' '}
        <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
          {t.auth.loginHere}
        </Link>
      </div>
    </div>
  );
}

export default Register;
