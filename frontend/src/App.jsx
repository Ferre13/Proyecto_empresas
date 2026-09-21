import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Upload from './pages/Upload';
import Success from './pages/Success';
import Triage from './pages/Triage';
import BatchList from './pages/BatchList';
import BatchDetail from './pages/BatchDetail';
import Mapping from './pages/Mapping';

const theme = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  text: 'var(--text)',
  textSecondary: 'var(--text-sec)',
  accent: 'var(--accent)',
  border: 'var(--border)',
  shadow: 'var(--shadow)',
  radius: '16px',
  radiusSmall: '12px'
};

function Navigation() {
  const location = useLocation();
  
  const navStyle = {
    display: 'flex',
    padding: '16px 40px',
    background: 'var(--nav-bg)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${theme.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const getLinkStyle = (path) => ({
    textDecoration: 'none',
    color: location.pathname === path ? theme.accent : theme.textSecondary,
    fontWeight: location.pathname === path ? '600' : '500',
    fontSize: '14px',
    padding: '6px 12px',
    borderRadius: '8px',
    backgroundColor: location.pathname === path ? 'rgba(0, 122, 255, 0.08)' : 'transparent',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    letterSpacing: '-0.01em'
  });

  return (
    <nav style={navStyle}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', letterSpacing: '-0.03em', color: theme.text }}>
          Docu<span style={{ fontWeight: '400', color: theme.accent }}>Flow</span>
        </h1>
      </Link>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Link to="/" style={getLinkStyle('/')}>Subir Facturas</Link>
        <Link to="/batches" style={getLinkStyle('/batches')}>Lotes Procesados</Link>
        <Link to="/mapping" style={getLinkStyle('/mapping')}>Mapeo ERP</Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <div style={{ 
      fontFamily: theme.fontFamily, 
      backgroundColor: theme.bg, 
      minHeight: '100vh',
      color: theme.text,
      WebkitFontSmoothing: 'antialiased',
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
      <style>{`
        :root {
          --bg: #F5F5F7;
          --surface: #FFFFFF;
          --text: #1d1d1f;
          --text-sec: #86868b;
          --accent: #007AFF;
          --border: rgba(0,0,0, 0.08);
          --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          --nav-bg: rgba(255, 255, 255, 0.8);
          --error: #FF3B30;
          --success: #34C759;
          --warning: #FF9500;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #000000;
            --surface: #1c1c1e;
            --text: #f5f5f7;
            --text-sec: #86868b;
            --accent: #0A84FF;
            --border: rgba(255,255,255, 0.15);
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
            --nav-bg: rgba(28, 28, 30, 0.8);
            --error: #FF453A;
            --success: #32D74B;
            --warning: #FF9F0A;
          }
        }
        body { margin: 0; padding: 0; background: var(--bg); }
        .apple-btn {
          transition: all 0.2s ease-in-out;
        }
        .apple-btn:hover {
          opacity: 0.85;
          transform: scale(1.01);
        }
        .apple-btn:active {
          transform: scale(0.98);
        }
        .apple-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, background-color 0.2s ease-in-out;
        }
        .apple-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow);
        }
        .clickable-card {
          cursor: pointer;
        }
        .clickable-card:hover {
          background-color: var(--border);
        }
        input, select {
          color: var(--text);
          background-color: var(--surface);
          border: 1px solid var(--border);
        }
        input:focus, select:focus {
          outline: 2px solid var(--accent);
          border-color: transparent;
        }
      `}</style>
      <Router>
        <Navigation />
        <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
          <Routes>
            <Route path="/" element={<Upload />} />
            <Route path="/success" element={<Success />} />
            <Route path="/batches" element={<BatchList />} />
            <Route path="/batch/:batchId" element={<BatchDetail />} />
            <Route path="/triage/:invoiceId" element={<Triage />} />
            <Route path="/mapping" element={<Mapping />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

export default App;
