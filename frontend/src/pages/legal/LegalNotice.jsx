import React from 'react';

function LegalNotice() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 0', lineHeight: '1.7', color: 'var(--text)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '8px' }}>
        Aviso Legal
      </h1>
      <p style={{ color: 'var(--text-sec)', fontSize: '14px', marginBottom: '32px' }}>
        Última actualización: 25 de septiembre de 2026. Conforme a la Ley 34/2002 (LSSI-CE).
      </p>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>1. Información General del Titular</h2>
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los datos identificativos del prestador de servicios:
        </p>
        <ul style={{ paddingLeft: '20px', color: 'var(--text)' }}>
          <li><strong>Denominación / Razón Social:</strong> DocuFlow AP Automation S.L. (o titular persona física/autónomo)</li>
          <li><strong>NIF / CIF:</strong> B-XXXXXXXX (o NIF del titular)</li>
          <li><strong>Domicilio Social:</strong> Calle Ejemplo 123, 28001 Madrid, España</li>
          <li><strong>Correo Electrónico de Contacto:</strong> soporte@docuflow.es</li>
          <li><strong>Actividad:</strong> Desarrollo y comercialización de software en la nube (SaaS B2B) para automatización contable.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>2. Objeto y Condiciones de Acceso</h2>
        <p>
          El presente Aviso Legal regula el uso de la plataforma web DocuFlow. El acceso y uso de la plataforma atribuye la condición de Usuario e implica la aceptación plena de todas las disposiciones incluidas en este Aviso Legal y en los Términos y Condiciones del servicio.
        </p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>3. Propiedad Intelectual e Industrial</h2>
        <p>
          Todos los contenidos del software, diseños, código fuente, logotipos, marcas y modelos de inteligencia artificial propios o adaptados son propiedad exclusiva del titular o de terceros licenciantes, estando protegidos por la legislación española e internacional de propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o ingeniería inversa sin autorización expresa.
        </p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>4. Naturaleza del Servicio y Exclusión de Responsabilidad</h2>
        <p>
          DocuFlow es una solución de extracción óptica e inteligencia artificial multimodal asistencial para lectura de documentos. <strong>No constituye asesoramiento contable, fiscal ni legal</strong>. El usuario es el único responsable de revisar y validar la exactitud de los importes, impuestos y datos extraídos antes de su exportación a libros contables oficiales o declaraciones tributarias.
        </p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>5. Legislación Aplicable y Jurisdicción</h2>
        <p>
          Para la resolución de cualquier controversia o cuestión litigiosa relativa a este sitio web o a las actividades en él desarrolladas, será de aplicación la legislación española, siendo competentes los Juzgados y Tribunales de Madrid capital (salvo que la ley aplicable establezca imperativamente otro fuero).
        </p>
      </section>
    </div>
  );
}

export default LegalNotice;
