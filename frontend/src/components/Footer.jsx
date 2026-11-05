import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
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
              Aviso Legal (LSSI)
            </Link>
          </li>
          <li>
            <Link to="/legal/proteccion-datos" style={linkItemStyle} className="apple-btn">
              Protección de Datos & DPA (RGPD)
            </Link>
          </li>
          <li>
            <Link to="/legal/terminos" style={linkItemStyle} className="apple-btn">
              Términos de Contratación
            </Link>
          </li>
          <li>
            <Link to="/legal/almacenamiento" style={linkItemStyle} className="apple-btn">
              Almacenamiento Local & Cookies
            </Link>
          </li>
        </ul>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
        <span>🔒 Cumplimiento estricto RGPD & LSSI-CE</span>
        <span>•</span>
        <span>⚡ Aislamiento Multi-tenant por Hardware & Software</span>
      </div>

      <div style={{ fontSize: '12px', opacity: 0.8 }}>
        © {new Date().getFullYear()} DocuFlow AP Automation. Todos los derechos reservados.
      </div>
    </footer>
  );
}

export default Footer;
