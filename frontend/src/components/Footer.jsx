import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function Footer() {
  const { t } = useLanguage();

  const footerStyle = {
    marginTop: '64px',
    padding: '32px 24px',
    borderTop: '1px solid var(--border)',
    fontSize: '13px',
    color: 'var(--text-sec)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    textAlign: 'center'
  };

  const linksStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    justifyContent: 'center',
    listStyle: 'none',
    padding: 0,
    margin: 0
  };

  const linkItemStyle = {
    color: 'var(--text-sec)',
    textDecoration: 'none',
    transition: 'color 0.2s',
    fontWeight: '500'
  };

  return (
    <footer style={footerStyle}>
      <nav aria-label="Legal">
        <ul style={linksStyle}>
          <li>
            <Link to="/legal/aviso-legal" style={linkItemStyle} className="apple-btn">
              {t.footer.legalNotice}
            </Link>
          </li>
          <li>
            <Link to="/legal/proteccion-datos" style={linkItemStyle} className="apple-btn">
              {t.footer.dataProtection}
            </Link>
          </li>
          <li>
            <Link to="/legal/terminos" style={linkItemStyle} className="apple-btn">
              {t.footer.terms}
            </Link>
          </li>
          <li>
            <Link to="/legal/almacenamiento" style={linkItemStyle} className="apple-btn">
              {t.footer.cookies}
            </Link>
          </li>
        </ul>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span>{t.footer.complianceBadge}</span>
        <span>•</span>
        <span>{t.footer.isolationBadge}</span>
      </div>

      <div style={{ fontSize: '12px', opacity: 0.8 }}>
        © {new Date().getFullYear()} DocuFlow AP Automation. {t.footer.rights}
      </div>
    </footer>
  );
}

export default Footer;
