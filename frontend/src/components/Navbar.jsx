import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function Navbar() {
  const { billingStatus, logout, isAuthenticated } = useAuth();
  const { lang, setLang, t, languages } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navStyle = {
    display: 'flex',
    padding: '16px 32px',
    background: 'var(--nav-bg)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    transition: 'background 0.3s ease'
  };

  const getLinkStyle = (path) => ({
    textDecoration: 'none',
    color: location.pathname === path ? 'var(--accent)' : 'var(--text-sec)',
    fontWeight: location.pathname === path ? '600' : '500',
    fontSize: '14px',
    padding: '6px 12px',
    borderRadius: '8px',
    backgroundColor: location.pathname === path ? 'rgba(0, 122, 255, 0.08)' : 'transparent',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    letterSpacing: '-0.01em'
  });

  const langSwitcher = (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      backgroundColor: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '3px',
      gap: '2px'
    }}>
      {languages.map((item) => {
        const active = lang === item.code;
        return (
          <button
            key={item.code}
            onClick={() => setLang(item.code)}
            title={item.label}
            style={{
              border: 'none',
              background: active ? 'var(--surface)' : 'transparent',
              color: active ? 'var(--text)' : 'var(--text-sec)',
              fontWeight: active ? '700' : '500',
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '7px',
              cursor: 'pointer',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>{item.flag}</span>
            <span>{item.short}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <nav style={navStyle}>
      {/* Logo */}
      <Link to={isAuthenticated ? "/app/upload" : "/"} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #007AFF, #5856D6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFF',
          fontWeight: '800',
          fontSize: '16px',
          boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)'
        }}>
          D
        </div>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', letterSpacing: '-0.03em', color: 'var(--text)' }}>
          Docu<span style={{ fontWeight: '400', color: 'var(--accent)' }}>Flow</span>
        </h1>
      </Link>

      {/* Navegación según estado de autenticación */}
      {isAuthenticated ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', marginRight: '8px' }}>
            <Link to="/app/upload" style={getLinkStyle('/app/upload')}>{t.nav.upload}</Link>
            <Link to="/app/batches" style={getLinkStyle('/app/batches')}>{t.nav.batches}</Link>
            <Link to="/app/mapping" style={getLinkStyle('/app/mapping')}>{t.nav.mapping}</Link>
          </div>

          {billingStatus && (
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: billingStatus.subscription_active ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 149, 0, 0.12)',
              color: billingStatus.subscription_active ? 'var(--success)' : 'var(--warning)',
              border: `1px solid ${billingStatus.subscription_active ? 'rgba(52, 199, 89, 0.25)' : 'rgba(255, 149, 0, 0.25)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>{billingStatus.subscription_active ? t.nav.planPro : `${t.nav.trial} (${billingStatus.trial_remaining}/5)`}</span>
            </div>
          )}

          {langSwitcher}

          <Link
            to="/app/settings"
            style={{
              ...getLinkStyle('/app/settings'),
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title={t.nav.settingsTitle}
          >
            ⚙️ {t.nav.settings}
          </Link>

          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-sec)',
              fontSize: '13px',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '8px',
              transition: 'color 0.2s',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-sec)'}
          >
            {t.nav.logout}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href="/#features" style={{ textDecoration: 'none', color: 'var(--text-sec)', fontSize: '14px', fontWeight: '500' }}>
              {t.nav.features}
            </a>
            <a href="/#how-it-works" style={{ textDecoration: 'none', color: 'var(--text-sec)', fontSize: '14px', fontWeight: '500' }}>
              {t.nav.howItWorks}
            </a>
            <a href="/#pricing" style={{ textDecoration: 'none', color: 'var(--text-sec)', fontSize: '14px', fontWeight: '500' }}>
              {t.nav.pricing}
            </a>
          </div>

          {langSwitcher}

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              to="/login"
              style={{
                textDecoration: 'none',
                color: 'var(--text)',
                fontSize: '14px',
                fontWeight: '600',
                padding: '8px 14px',
                borderRadius: '10px',
                transition: 'opacity 0.2s'
              }}
            >
              {t.nav.login}
            </Link>
            <Link
              to="/register"
              className="apple-btn"
              style={{
                textDecoration: 'none',
                backgroundColor: 'var(--accent)',
                color: '#FFF',
                fontSize: '13px',
                fontWeight: '600',
                padding: '8px 16px',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0, 122, 255, 0.25)'
              }}
            >
              {t.nav.tryFree}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
