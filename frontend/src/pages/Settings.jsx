import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

function Settings() {
  const { user, billingStatus, refreshBilling, logout } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    refreshBilling();
  }, []);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setStatusMsg(t.settings.connectingStripe);
      const response = await api.post('/billing/create-checkout-session');
      window.location.href = response.data.url;
    } catch (err) {
      setStatusMsg(t.upload.stripeError);
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setLoading(true);
      setStatusMsg(t.settings.openingPortal);
      const response = await api.post('/billing/create-portal-session');
      window.location.href = response.data.url;
    } catch (err) {
      if (err.response && err.response.status === 400) {
        handleSubscribe();
      } else {
        setStatusMsg(t.upload.stripeError);
        setLoading(false);
      }
    }
  };

  const cardStyle = {
    backgroundColor: 'var(--surface)',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    padding: '28px',
    marginBottom: '24px',
    boxShadow: 'var(--shadow)'
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
      <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.03em', margin: '0 0 8px 0' }}>
        {t.settings.title}
      </h2>
      <p style={{ color: 'var(--text-sec)', fontSize: '15px', margin: '0 0 28px 0' }}>
        {t.settings.subtitle}
      </p>

      <div style={cardStyle}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {t.settings.companyCardTitle}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginBottom: '4px' }}>{t.settings.companyNameLabel}</div>
            <div style={{ fontSize: '15px', fontWeight: '600' }}>
              {billingStatus?.company_name || user?.company_name || 'Mi Empresa'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginBottom: '4px' }}>{t.settings.adminUserLabel}</div>
            <div style={{ fontSize: '15px', fontWeight: '600' }}>
              {billingStatus?.user_email || user?.email || 'N/A'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginBottom: '4px' }}>{t.settings.tenantIdLabel}</div>
            <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-sec)', backgroundColor: 'var(--bg)', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>
              {billingStatus?.tenant_id || user?.id || 'demo-tenant'}
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {t.settings.billingCardTitle}
          </h3>

          {billingStatus && (
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: billingStatus.subscription_active ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 149, 0, 0.12)',
              color: billingStatus.subscription_active ? 'var(--success)' : 'var(--warning)',
              border: `1px solid ${billingStatus.subscription_active ? 'rgba(52, 199, 89, 0.25)' : 'rgba(255, 149, 0, 0.25)'}`
            }}>
              {billingStatus.subscription_active ? t.settings.statusActivePro : t.settings.statusTrial}
            </span>
          )}
        </div>

        {billingStatus?.is_trial && (
          <div style={{
            backgroundColor: 'var(--bg)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
              <span>{t.settings.trialQuotaLabel}</span>
              <span>{billingStatus.invoices_processed} / {billingStatus.trial_limit} {t.settings.invoicesUsed}</span>
            </div>

            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, (billingStatus.invoices_processed / billingStatus.trial_limit) * 100)}%`,
                height: '100%',
                backgroundColor: 'var(--accent)',
                transition: 'width 0.3s ease'
              }} />
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-sec)', margin: '8px 0 0 0' }}>
              {t.settings.trialRemainingPrefix} <strong>{billingStatus.trial_remaining}</strong> {t.settings.trialRemainingSuffix}
            </p>
          </div>
        )}

        <p style={{ fontSize: '14px', color: 'var(--text-sec)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
          {billingStatus?.subscription_active ? t.settings.proDesc : t.settings.trialDesc}
        </p>

        {statusMsg && (
          <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '600', marginBottom: '16px' }}>
            {statusMsg}
          </div>
        )}

        {billingStatus?.subscription_active ? (
          <button
            className="apple-btn"
            onClick={handleManageBilling}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {t.settings.openStripePortal}
          </button>
        ) : (
          <button
            className="apple-btn"
            onClick={handleSubscribe}
            disabled={loading}
            style={{
              padding: '14px 28px',
              backgroundColor: 'var(--accent)',
              color: '#FFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: loading ? 'default' : 'pointer',
              boxShadow: '0 4px 12px rgba(0, 122, 255, 0.25)'
            }}
          >
            {t.settings.activateProBtn}
          </button>
        )}
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 12px 0' }}>
          {t.settings.securityCardTitle}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-sec)', margin: '0 0 16px 0' }}>
          {t.settings.securityDesc}
        </p>
        <button
          onClick={logout}
          className="apple-btn"
          style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(255, 59, 48, 0.08)',
            color: 'var(--error)',
            border: '1px solid rgba(255, 59, 48, 0.2)',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {t.nav.logout}
        </button>
      </div>
    </div>
  );
}

export default Settings;
