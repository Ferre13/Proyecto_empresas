import React from 'react';

function StorageTerms() {
  const handleOpenCookieSettings = () => {
    try {
      localStorage.removeItem('compliance_consent');
    } catch (e) {}
    window.location.reload();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 0', lineHeight: '1.7', color: 'var(--text)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '8px' }}>
        Política de Cookies y Almacenamiento Local
      </h1>
      <p style={{ color: 'var(--text-sec)', fontSize: '14px', marginBottom: '32px' }}>
        Información sobre el uso de cookies y tecnologías de almacenamiento conforme al Art. 22.2 de la LSSI-CE y la Guía de Cookies de la AEPD.
      </p>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>1. ¿Qué son las Cookies y el Almacenamiento Local?</h2>
        <p>
          Una cookie es un pequeño archivo que se descarga en su dispositivo al acceder a determinadas páginas web. Asimismo, nuestra plataforma utiliza tecnologías equivalentes como <code>localStorage</code> para almacenar preferencias del usuario, tokens de sesión y estados de la aplicación sin sobrecargar el tráfico de red.
        </p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>2. Tipología de Cookies Empleadas en DocuFlow</h2>
        
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginTop: '16px', marginBottom: '8px' }}>A. Cookies y Almacenamiento Estrictamente Necesario (Técnicas)</h3>
        <p>
          Son esenciales para el funcionamiento del SaaS y la seguridad de su sesión. No requieren consentimiento previo:
        </p>
        <ul style={{ paddingLeft: '20px' }}>
          <li><code>supabase_token</code> (localStorage): Token JWT cifrado para autenticar sus peticiones a la API bajo aislamiento multi-tenant.</li>
          <li><code>cookie_consent</code> (localStorage): Registra sus preferencias de privacidad para no mostrar el banner en cada visita.</li>
          <li><code>theme_preference</code>: Mantiene la selección de modo claro u oscuro según su sistema operativo.</li>
        </ul>

        <h3 style={{ fontSize: '16px', fontWeight: '700', marginTop: '16px', marginBottom: '8px' }}>B. Cookies de Terceros Esenciales</h3>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Stripe Inc.:</strong> Utilizadas durante el proceso de pago seguro y prevención de fraude en transacciones (Stripe Radar). Exentas de consentimiento por ser imprescindibles para la ejecución del pago.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>3. Gestión y Configuración de Consentimiento</h2>
        <p>
          En cualquier momento puede modificar o revocar sus preferencias sobre cookies opcionales pulsando el siguiente botón:
        </p>
        <div style={{ marginTop: '16px', marginBottom: '20px' }}>
          <button
            className="apple-btn"
            onClick={handleOpenCookieSettings}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--accent)',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            ⚙️ Reabrir Configurador de Cookies
          </button>
        </div>
        <p>
          Asimismo, puede restringir, bloquear o borrar las cookies configurando las opciones de su navegador web (Chrome, Safari, Firefox, Edge).
        </p>
      </section>
    </div>
  );
}

export default StorageTerms;
