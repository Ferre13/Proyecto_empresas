import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Páginas Públicas
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import NotFound from './pages/NotFound';

// Páginas de la Aplicación (Protegidas)
import Upload from './pages/Upload';
import BatchList from './pages/BatchList';
import BatchDetail from './pages/BatchDetail';
import Triage from './pages/Triage';
import Mapping from './pages/Mapping';
import Settings from './pages/Settings';

// Blindaje contra bloqueadores de contenido (AdGuard, Wipr, 1Blocker, EasyList)
const ComplianceModal = lazy(() =>
  import('./components/ComplianceModal').catch(() => ({ default: () => null }))
);
const DataProtection = lazy(() =>
  import('./pages/legal/DataProtection').catch(() => ({ default: () => null }))
);
const StorageTerms = lazy(() =>
  import('./pages/legal/StorageTerms').catch(() => ({ default: () => null }))
);
const LegalNotice = lazy(() =>
  import('./pages/legal/LegalNotice').catch(() => ({ default: () => null }))
);
const TermsOfService = lazy(() =>
  import('./pages/legal/TermsOfService').catch(() => ({ default: () => null }))
);

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

function App() {
  return (
    <AuthProvider>
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
            --nav-bg: rgba(255, 255, 255, 0.85);
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
              --nav-bg: rgba(28, 28, 30, 0.85);
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
            opacity: 0.88;
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
          <Navbar />
          <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 24px' }}>
            <Suspense fallback={<div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-sec)' }}>Cargando...</div>}>
              <Routes>
                {/* Rutas Públicas */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/success" element={<Success />} />
                <Route path="/cancel" element={<Cancel />} />

                {/* Rutas Legales (con blindaje) */}
                <Route path="/legal/aviso-legal" element={<LegalNotice />} />
                <Route path="/legal/proteccion-datos" element={<DataProtection />} />
                <Route path="/legal/privacidad" element={<DataProtection />} />
                <Route path="/legal/terminos" element={<TermsOfService />} />
                <Route path="/legal/almacenamiento" element={<StorageTerms />} />
                <Route path="/legal/cookies" element={<StorageTerms />} />

                {/* Rutas Privadas / Aplicación (Protegidas) */}
                <Route path="/app" element={<Navigate to="/app/upload" replace />} />
                <Route path="/app/upload" element={
                  <ProtectedRoute>
                    <Upload />
                  </ProtectedRoute>
                } />
                <Route path="/app/batches" element={
                  <ProtectedRoute>
                    <BatchList />
                  </ProtectedRoute>
                } />
                <Route path="/app/batch/:batchId" element={
                  <ProtectedRoute>
                    <BatchDetail />
                  </ProtectedRoute>
                } />
                <Route path="/app/triage/:invoiceId" element={
                  <ProtectedRoute>
                    <Triage />
                  </ProtectedRoute>
                } />
                <Route path="/app/mapping" element={
                  <ProtectedRoute>
                    <Mapping />
                  </ProtectedRoute>
                } />
                <Route path="/app/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />

                {/* Redirecciones de Compatibilidad */}
                <Route path="/upload" element={<Navigate to="/app/upload" replace />} />
                <Route path="/batches" element={<Navigate to="/app/batches" replace />} />
                <Route path="/mapping" element={<Navigate to="/app/mapping" replace />} />
                <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
                <Route path="/batch/:batchId" element={<Navigate to="/app/batches" replace />} />
                <Route path="/triage/:invoiceId" element={<Navigate to="/app/batches" replace />} />

                {/* 404 No encontrado */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <Suspense fallback={null}>
            <ComplianceModal />
          </Suspense>
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
