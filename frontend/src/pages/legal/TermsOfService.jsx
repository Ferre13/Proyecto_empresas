import React from 'react';

function TermsOfService() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 0', lineHeight: '1.7', color: 'var(--text)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '8px' }}>
        Términos y Condiciones de Contratación y Uso
      </h1>
      <p style={{ color: 'var(--text-sec)', fontSize: '14px', marginBottom: '32px' }}>
        Condiciones generales de contratación mercantil para empresas y profesionales (SaaS B2B).
      </p>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>1. Objeto y Ámbito de Aplicación</h2>
        <p>
          Las presentes Condiciones regulan la contratación de la suscripción al software DocuFlow, una plataforma SaaS orientada a la extracción y estructuración automatizada de facturas mediante modelos de visión multimodal e inteligencia artificial, triaje colaborativo y exportación a formatos contables para sistemas ERP (SAP, Holded, Sage, A3, etc.).
        </p>
        <p>
          El servicio está dirigido <strong>exclusivamente a personas jurídicas y profesionales autónomos</strong> en el ejercicio de su actividad empresarial o profesional (relación B2B).
        </p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>2. Suscripción, Precios y Pasarela de Pagos (Stripe)</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Modelo de Facturación:</strong> El acceso a la plataforma se comercializa bajo suscripción periódica recurrente (mensual o anual según la tarifa contratada).</li>
          <li><strong>Cobro Seguro:</strong> Los pagos se gestionan de forma cifrada a través de Stripe. DocuFlow nunca almacena ni tiene acceso a los números completos de tarjetas bancarias.</li>
          <li><strong>Impuestos:</strong> Los precios mostrados en la plataforma se indican netos (sin IVA u otros impuestos indirectos aplicables), los cuales se desglosarán en el proceso de pago según la residencia fiscal del Cliente.</li>
          <li><strong>Período de Gracia:</strong> En caso de fallo transitorio en el cobro de una cuota, el Cliente dispondrá de un plazo de gracia de cortesía mientras Stripe reintenta el cobro antes de proceder a la suspensión del servicio.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>3. Cancelación y Política de Reembolso</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Cancelación sin Permanencia:</strong> El Cliente puede cancelar su suscripción en cualquier momento y de forma autónoma desde el <em>Stripe Customer Portal</em> habilitado en la sección de facturación. La cancelación surtirá efecto al término del ciclo de facturación vigente, conservando el acceso hasta dicha fecha.</li>
          <li><strong>Garantía de Satisfacción:</strong> Se otorga un plazo de 14 días naturales desde la contratación inicial para solicitar el reembolso si la plataforma presenta incompatibilidades técnicas no subsanables con los formatos del cliente.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>4. Limitación de Responsabilidad y Uso de la Inteligencia Artificial</h2>
        <p>
          <strong>IMPORTANTE:</strong> DocuFlow utiliza modelos avanzados de inteligencia artificial (Gemini) y algoritmos de validación matemática para la extracción de datos contables. No obstante, por la propia naturaleza probabilística de la tecnología OCR e IA:
        </p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>El Cliente reconoce que la herramienta es un <strong>asistente operativo</strong> y que los datos extraídos pueden contener inexactitudes o discrepancias derivadas de documentos borrosos, dañados o formatos atípicos.</li>
          <li>El Cliente asume la <strong>obligación y responsabilidad exclusiva de verificar, revisar y dar el visto bueno (mediante la pantalla de Triaje)</strong> a todos los importes, bases imponibles, impuestos y números de factura antes de su contabilización definitiva o presentación ante las autoridades fiscales.</li>
          <li>En ningún caso DocuFlow responderá por sanciones tributarias, errores en declaraciones de impuestos, lucro cesante o pérdidas indirectas que se deriven del uso de los datos generados.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>5. Declaración de No Emisión Fiscal (Ley 11/2021 y VeriFactu)</h2>
        <p>
          Se hace constar expresamente que DocuFlow es un software de captura y extracción de documentos recibidos (Cuentas por Pagar / AP). 
          <strong>DocuFlow no es un sistema de emisión de facturas expedidas ni un software de facturación certificada en los términos del Reglamento VeriFactu (Real Decreto 1007/2023)</strong>. DocuFlow no genera registros de facturación con códigos hash ni códigos QR de verificación tributaria, debiendo el Cliente utilizar su software de facturación homologado para la emisión de sus propias facturas.
        </p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>6. Disponibilidad del Servicio (SLA)</h2>
        <p>
          DocuFlow realiza los mejores esfuerzos técnicos para garantizar una disponibilidad del servicio del 99,5% mensual, salvo paradas programadas de mantenimiento debidamente notificadas o incidencias imputables a proveedores de infraestructura esenciales (Google Cloud, Supabase, Stripe o caída general de telecomunicaciones).
        </p>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>7. Ley Aplicable y Fuero Jurisdiccional</h2>
        <p>
          Estas Condiciones Generales se rigen por la ley española. Tratándose de contratos entre partes mercantiles (B2B), cualquier controversia que pudiera derivarse se someterá con renuncia expresa a cualquier otro fuero a los Juzgados y Tribunales de la ciudad de Madrid (España).
        </p>
      </section>
    </div>
  );
}

export default TermsOfService;
