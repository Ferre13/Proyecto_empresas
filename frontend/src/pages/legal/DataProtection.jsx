import React from 'react';

function DataProtection() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 0', lineHeight: '1.7', color: 'var(--text)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '8px' }}>
        Política de Privacidad y Acuerdo de Tratamiento de Datos (DPA)
      </h1>
      <p style={{ color: 'var(--text-sec)', fontSize: '14px', marginBottom: '32px' }}>
        Conforme al Reglamento General de Protección de Datos (RGPD UE 2016/679) y a la Ley Orgánica 3/2018 (LOPDGDD).
      </p>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>PARTE I: DocuFlow como Responsable del Tratamiento</h2>
        <p>
          Esta sección aplica a los datos personales de nuestros usuarios y clientes directos (administradores y empleados que operan la cuenta SaaS).
        </p>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Responsable del Tratamiento:</strong> DocuFlow AP Automation (contacto: privacidad@docuflow.es).</li>
          <li><strong>Finalidades:</strong> Gestión del alta, autenticación (Supabase Auth), facturación recurrente de suscripción (Stripe) y prestación del servicio SaaS.</li>
          <li><strong>Base Jurídica:</strong> Ejecución de la relación contractual mercantil (Art. 6.1.b RGPD) y cumplimiento de obligaciones fiscales y legales (Art. 6.1.c RGPD).</li>
          <li><strong>Destinatarios y Transferencias:</strong> 
            Proveedores necesarios para la infraestructura: Stripe Payments Europe Ltd. (pasarela de pagos segura), Supabase Inc. (autenticación descentralizada alojada en región UE - Fráncfort), y Google Cloud EMEA Ltd. (servicios de computación e inferencia de IA). Todos ellos suscritos a cláusulas contractuales tipo (SCC) avaladas por la Comisión Europea.
          </li>
          <li><strong>Plazos de Conservación:</strong> Los datos de cuenta se conservarán durante la vigencia de la suscripción y, posteriormente, durante los plazos legalmente exigibles para responsabilidades tributarias (mínimo 4 a 6 años).</li>
          <li><strong>Derechos del Interesado:</strong> Puede ejercer sus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición enviando un email a <code>privacidad@docuflow.es</code> o reclamando ante la Agencia Española de Protección de Datos (AEPD - www.aepd.es).</li>
        </ul>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>PARTE II: Acuerdo de Encargo de Tratamiento (DPA - Art. 28 RGPD)</h2>
        <p>
          En el marco de la extracción automatizada de facturas, los documentos cargados por el Cliente pueden contener datos personales de terceros (ej. proveedores, autónomos, nombres de contactos, cuentas bancarias e identificadores fiscales). 
          <strong>El Cliente actúa como Responsable del Tratamiento y DocuFlow actúa como Encargado del Tratamiento</strong>.
        </p>
        
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginTop: '16px', marginBottom: '8px' }}>1. Objeto y Duración del Tratamiento</h3>
        <p>
          DocuFlow tratará los datos contenidos en las facturas únicamente con el propósito técnico de parsear, estructurar y validar los importes contables para su posterior exportación al ERP del Cliente.
        </p>

        <h3 style={{ fontSize: '16px', fontWeight: '700', marginTop: '16px', marginBottom: '8px' }}>2. Compromisos de Seguridad y Privacidad (Pilar Stateless & Muro Legal)</h3>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Aislamiento Estricto Multi-Tenant:</strong> Los datos y documentos de cada empresa cliente están estrictamente particionados y aislados a nivel de base de datos relacional y consultas lógicas mediante <code>tenant_id</code>.</li>
          <li><strong>Inexistencia de Memoria o Re-entrenamiento:</strong> Las llamadas a los modelos de inteligencia artificial se realizan bajo aislamiento absoluto sin estado (stateless). Google Gemini procesa cada factura de manera individual y <strong>los datos jamás se utilizan para entrenar modelos públicos ni se comparten con terceros</strong>.</li>
          <li><strong>Política de Purga Automática en 24 Horas:</strong> Los archivos físicos almacenados en nuestros volúmenes temporales se eliminan automáticamente tras el procesamiento o en un plazo máximo e improrrogable de 24 horas mediante tareas asíncronas de limpieza programadas. El cliente puede además purgar inmediatamente cualquier lote eliminándolo desde su panel de control.</li>
          <li><strong>Deber de Secreto y Confidencialidad:</strong> Todo el personal y procesos de DocuFlow están sujetos a un estricto deber de confidencialidad y secreto profesional.</li>
        </ul>

        <h3 style={{ fontSize: '16px', fontWeight: '700', marginTop: '16px', marginBottom: '8px' }}>3. Subencargados del Tratamiento Autorizados</h3>
        <p>
          El Cliente autoriza de forma general la subcontratación de los siguientes proveedores de infraestructura tecnológica para la ejecución del servicio:
        </p>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Google Cloud Platform / Google AI:</strong> Procesamiento OCR y Structured Outputs (API sin almacenamiento persistente).</li>
          <li><strong>Supabase:</strong> Alojamiento de bases de datos relacionales en centros de datos ubicados en la Unión Europea.</li>
        </ul>

        <h3 style={{ fontSize: '16px', fontWeight: '700', marginTop: '16px', marginBottom: '8px' }}>4. Notificación de Brechas de Seguridad</h3>
        <p>
          En caso de producirse un incidente que comprometa la seguridad de los datos personales tratados, DocuFlow lo notificará al Cliente sin dilación indebida y a más tardar en el plazo máximo de 48 horas desde que tenga conocimiento del mismo.
        </p>
      </section>
    </div>
  );
}

export default DataProtection;
