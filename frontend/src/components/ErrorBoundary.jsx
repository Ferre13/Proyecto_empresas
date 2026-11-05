import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    } catch (e) {
      console.error("Failed to clear cache:", e);
    }
    // Forzar recarga completa evitando caché del navegador
    window.location.href = window.location.origin + window.location.pathname + '?t=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F5F5F7',
          padding: '24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#1d1d1f'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            padding: '40px 32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
              Se ha producido un error inesperado
            </h2>
            <p style={{ fontSize: '14px', color: '#86868b', lineHeight: '1.5', margin: '0 0 24px 0' }}>
              Es posible que tu navegador mantenga datos antiguos en caché o haya ocurrido un conflicto con extensiones o almacenamiento local.
            </p>

            {this.state.error && (
              <div style={{
                textAlign: 'left',
                backgroundColor: 'rgba(255, 59, 48, 0.05)',
                border: '1px solid rgba(255, 59, 48, 0.2)',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#FF3B30',
                marginBottom: '24px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={this.handleClearCacheAndReload}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#007AFF',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)'
                }}
              >
                🔄 Limpiar Caché y Recargar
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#1d1d1f',
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Volver a la Página Principal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
