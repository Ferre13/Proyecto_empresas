import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Si ya está autenticado, redirigir al panel de la aplicación
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
          <span>⚡ Potenciado por Gemini 2.5 Flash</span>
          <span>•</span>
          <span>100% Conforme RGPD</span>
        </div>

        <h1 className="hero-title">
          Automatización de Cuentas por Pagar con IA para Empresas
        </h1>

        <p style={{
          fontSize: '18px',
          lineHeight: '1.6',
          color: 'var(--text-sec)',
          maxWidth: '680px',
          margin: '0 auto 36px auto'
        }}>
          Extrae datos de facturas en segundos, valida la integridad matemática sin errores de cuadre y expórtalas al formato exacto de tu ERP.
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
            Probar 5 Facturas Gratis ➔
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
            Ver Cómo Funciona
          </a>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-sec)', marginTop: '14px' }}>
          Sin tarjeta de crédito requerida • Configuración en menos de 2 minutos
        </p>
      </section>

      {/* Visual Product Showcase / Mockup Preview */}
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
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-sec)' }}>Extracción Multimodal & Conciliación en Vivo</span>
          <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>✓ 100% Cuadrado</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '16px', backgroundColor: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginBottom: '4px' }}>1. Documento Original</div>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>Factura_Amazon_AWS.pdf</div>
            <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginTop: '8px' }}>Pasa por Gemini 2.5 Flash Structured Outputs</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginBottom: '4px' }}>2. Reconciliación Matemática</div>
            <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--success)' }}>1.000,00€ + 210,00€ = 1.210,00€</div>
            <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginTop: '8px' }}>Base Imponible + IVA verificados</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginBottom: '4px' }}>3. Exportación ERP</div>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>SAP / Holded / Sage</div>
            <div style={{ fontSize: '12px', color: 'var(--text-sec)', marginTop: '8px' }}>Mapeo dinámico de columnas listo para volcar</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', margin: '0 0 10px 0' }}>
            Cómo Funciona en 3 Pasos
          </h2>
          <p style={{ color: 'var(--text-sec)', fontSize: '16px', margin: 0 }}>
            Diseñado para eliminar horas de picado manual de datos contables
          </p>
        </div>

        <div className="feature-grid">
          <div className="step-card">
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>📥</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>1. Sube en Lotes o Individual</h3>
            <p style={{ color: 'var(--text-sec)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Arrastra archivos en PDF, imágenes o paquetes ZIP comprimidos. El sistema los encola y procesa de forma asíncrona y segura.
            </p>
          </div>

          <div className="step-card">
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>🤖</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>2. Extracción & Cuadre Matemático</h3>
            <p style={{ color: 'var(--text-sec)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              La IA reconoce proveedores, NIFs, fechas y totales. Nuestro validador algorítmico comprueba que no haya discrepancias en los impuestos.
            </p>
          </div>

          <div className="step-card">
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>3. Triaje y Descarga Contable</h3>
            <p style={{ color: 'var(--text-sec)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Revisa anomalías en una pantalla dividida inteligente y descarga el fichero adaptado a la estructura de campos de tu software ERP.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', margin: '0 0 10px 0' }}>
            Los 4 Pilares de DocuFlow
          </h2>
          <p style={{ color: 'var(--text-sec)', fontSize: '16px', margin: 0 }}>
            Seguridad estricta, arquitectura sin estado y máxima precisión contable
          </p>
        </div>

        <div className="feature-grid">
          <div className="step-card">
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🔒</div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0' }}>Aislamiento Multi-Tenant Estricto</h4>
            <p style={{ color: 'var(--text-sec)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
              Tus documentos y datos están aislados lógicamente por tenant_id tanto en base de datos como en workers. Ningún dato se cruza jamás.
            </p>
          </div>

          <div className="step-card">
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛡️</div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0' }}>Muro Legal RGPD & Purga 24h</h4>
            <p style={{ color: 'var(--text-sec)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
              Cumplimiento riguroso del Art. 28 RGPD con DPA incorporado. Los archivos físicos se purgan automáticamente tras 24 horas.
            </p>
          </div>

          <div className="step-card">
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🧮</div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0' }}>Tolerancia Cero a Descuadres</h4>
            <p style={{ color: 'var(--text-sec)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
              Validación matemática estricta: Base Imponible + IVA - Retenciones (IRPF) = Total Factura. Evita cualquier riesgo ante la Agencia Tributaria.
            </p>
          </div>

          <div className="step-card">
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚡</div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0' }}>Mapeador Universal para ERP</h4>
            <p style={{ color: 'var(--text-sec)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
              Configura visualmente los nombres y el orden de columnas que tu software necesita (SAP, Holded, Sage, A3, Excel o CSV personalizado).
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', margin: '0 0 10px 0' }}>
            Precio Simple, Transparente y Sin Letra Pequeña
          </h2>
          <p style={{ color: 'var(--text-sec)', fontSize: '16px', margin: 0 }}>
            Todo incluido en una única tarifa mensual predecible
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
              Plan Todo Incluido
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: '700', margin: '12px 0 6px 0' }}>Plan Pro Empresas</h3>
            <p style={{ color: 'var(--text-sec)', fontSize: '14px', margin: '0 0 24px 0' }}>
              Para asesorías, despachos contables y PYMEs en crecimiento
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
              <span style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text)' }}>49€</span>
              <span style={{ color: 'var(--text-sec)', fontSize: '16px' }}>/ mes</span>
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
              <li>✓ <strong>5 Facturas de Prueba Gratis</strong> incluidas al registrarte</li>
              <li>✓ Extracción con IA multimodal (Gemini 2.5 Flash)</li>
              <li>✓ Procesamiento asíncrono y subida por lotes ZIP</li>
              <li>✓ Validación matemática de bases e impuestos</li>
              <li>✓ Pantalla de Triaje asistido con visor integrado</li>
              <li>✓ Exportador dinámico a SAP, Holded, Sage y Excel</li>
              <li>✓ Purga automática RGPD certificada en 24h</li>
              <li>✓ Cancelación autónoma sin permanencia en 1 clic</li>
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
              Comenzar Prueba Gratuita
            </Link>
            <p style={{ fontSize: '12px', color: 'var(--text-sec)', marginTop: '12px' }}>
              Pagos cifrados y seguros procesados por Stripe
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
