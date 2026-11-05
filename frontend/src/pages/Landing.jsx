import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function Landing() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/upload');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
      <style>{`
        .hero-title {
          font-size: 52px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.04em;
          margin-bottom: 20px;
          background: linear-gradient(180deg, var(--text) 0%, rgba(29, 29, 31, 0.75) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 36px; }
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-top: 40px;
        }
        .step-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .step-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
        }
      `}</style>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '60px 16px 40px 16px', maxWidth: '860px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '24px',
          backgroundColor: 'rgba(0, 122, 255, 0.08)',
          color: 'var(--accent)',
          fontSize: '13px',
          fontWeight: '700',
          marginBottom: '24px',
          border: '1px solid rgba(0, 122, 255, 0.2)'
        }}>
          <span>{t.landing.badgeAi}</span>
          <span>•</span>
          <span>{t.landing.badgeGdpr}</span>
        </div>

        <h1 className="hero-title">
          {t.landing.heroTitle}
        </h1>

        <p style={{
          fontSize: '18px',
          lineHeight: '1.6',
          color: 'var(--text-sec)',
          maxWidth: '680px',
          margin: '0 auto 36px auto'
        }}>
          {t.landing.heroSubtitle}
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/register"
            className="apple-btn"
            style={{
              padding: '16px 36px',
              backgroundColor: 'var(--accent)',
              color: '#FFF',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(0, 122, 255, 0.3)'
            }}
          >
            {t.landing.ctaPrimary}
          </Link>
          <a
            href="#how-it-works"
            className="apple-btn"
            style={{
              padding: '16px 28px',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            {t.landing.ctaSecondary}
          </a>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-sec)', marginTop: '14px' }}>
          {t.landing.noCard}
        </p>
      </section>

      {/* Visual Product Showcase */}
      <section style={{
        margin: '20px auto 70px auto',
        maxWidth: '920px',
        backgroundColor: 'var(--surface)',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FF5F56', display: 'inline-block' }}></span>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FFBD2E', display: 'inline-block' }}></span>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27C93F', display: 'inline-block' }}></span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-sec)' }}>{t.landing.previewHeader}</span>
          <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>{t.landing.previewMatched}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '16px', backgroundColor: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginBottom: '4px' }}>{t.landing.previewStep1Label}</div>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>Invoice_AWS_Cloud.pdf</div>
            <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginTop: '8px' }}>{t.landing.previewStep1Sub}</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginBottom: '4px' }}>{t.landing.previewStep2Label}</div>
            <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--success)' }}>1,000.00 + 210.00 = 1,210.00</div>
            <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginTop: '8px' }}>{t.landing.previewStep2Sub}</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginBottom: '4px' }}>{t.landing.previewStep3Label}</div>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>{t.landing.previewStep3Val}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginTop: '8px' }}>{t.landing.previewStep3Sub}</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', margin: '0 0 10px 0' }}>
            {t.landing.howTitle}
          </h2>
          <p style={{ color: 'var(--text-sec)', fontSize: '16px', margin: 0 }}>
            {t.landing.howSubtitle}
          </p>
        </div>

        <div className="feature-grid">
          <div className="step-card">
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>📥</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>{t.landing.step1Title}</h3>
            <p style={{ color: 'var(--text-sec)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              {t.landing.step1Desc}
            </p>
          </div>

          <div className="step-card">
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>🤖</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>{t.landing.step2Title}</h3>
            <p style={{ color: 'var(--text-sec)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              {t.landing.step2Desc}
            </p>
          </div>

          <div className="step-card">
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>{t.landing.step3Title}</h3>
            <p style={{ color: 'var(--text-sec)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              {t.landing.step3Desc}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', margin: '0 0 10px 0' }}>
            {t.landing.pillarsTitle}
          </h2>
          <p style={{ color: 'var(--text-sec)', fontSize: '16px', margin: 0 }}>
            {t.landing.pillarsSubtitle}
          </p>
        </div>

        <div className="feature-grid">
          <div className="step-card">
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🔒</div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0' }}>{t.landing.pillar1Title}</h4>
            <p style={{ color: 'var(--text-sec)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
              {t.landing.pillar1Desc}
            </p>
          </div>

          <div className="step-card">
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛡️</div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0' }}>{t.landing.pillar2Title}</h4>
            <p style={{ color: 'var(--text-sec)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
              {t.landing.pillar2Desc}
            </p>
          </div>

          <div className="step-card">
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🧮</div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0' }}>{t.landing.pillar3Title}</h4>
            <p style={{ color: 'var(--text-sec)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
              {t.landing.pillar3Desc}
            </p>
          </div>

          <div className="step-card">
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚡</div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0' }}>{t.landing.pillar4Title}</h4>
            <p style={{ color: 'var(--text-sec)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
              {t.landing.pillar4Desc}
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', margin: '0 0 10px 0' }}>
            {t.landing.pricingTitle}
          </h2>
          <p style={{ color: 'var(--text-sec)', fontSize: '16px', margin: 0 }}>
            {t.landing.pricingSubtitle}
          </p>
        </div>

        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '2px solid var(--accent)',
            borderRadius: '24px',
            padding: '40px 32px',
            boxShadow: '0 16px 40px rgba(0, 122, 255, 0.1)',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--accent)',
              color: '#FFF',
              fontSize: '12px',
              fontWeight: '700',
              padding: '4px 16px',
              borderRadius: '20px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              {t.landing.pricingBadge}
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: '700', margin: '12px 0 6px 0' }}>{t.landing.pricingPlanName}</h3>
            <p style={{ color: 'var(--text-sec)', fontSize: '14px', margin: '0 0 24px 0' }}>
              {t.landing.pricingPlanDesc}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
              <span style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text)' }}>49€</span>
              <span style={{ color: 'var(--text-sec)', fontSize: '16px' }}>{t.landing.pricingPerMonth}</span>
            </div>

            <ul style={{
              textAlign: 'left',
              paddingLeft: '20px',
              margin: '0 0 32px 0',
              color: 'var(--text)',
              fontSize: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              lineHeight: '1.5'
            }}>
              <li>✓ <strong>{t.landing.pricingF1}</strong></li>
              <li>✓ {t.landing.pricingF2}</li>
              <li>✓ {t.landing.pricingF3}</li>
              <li>✓ {t.landing.pricingF4}</li>
              <li>✓ {t.landing.pricingF5}</li>
              <li>✓ {t.landing.pricingF6}</li>
              <li>✓ {t.landing.pricingF7}</li>
              <li>✓ {t.landing.pricingF8}</li>
            </ul>

            <Link
              to="/register"
              className="apple-btn"
              style={{
                display: 'block',
                width: '100%',
                padding: '16px 0',
                backgroundColor: 'var(--accent)',
                color: '#FFF',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(0, 122, 255, 0.3)'
              }}
            >
              {t.landing.pricingCta}
            </Link>
            <p style={{ fontSize: '12px', color: 'var(--text-sec)', marginTop: '12px' }}>
              {t.landing.pricingStripeNote}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
