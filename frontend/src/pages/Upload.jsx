import React, { useState } from 'react';
import api from '../services/api';

function Upload() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('');
  const [batchId, setBatchId] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    for (let file of files) {
      formData.append('files', file);
    }

    try {
      setStatus('Subiendo...');
      const response = await api.post('/upload/', formData);
      setBatchId(response.data.batch_id);
      setStatus(`Subida exitosa. Lote: ${response.data.batch_id}. Procesando...`);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setStatus('Error: Suscripción inactiva. Debes suscribirte para subir archivos.');
      } else {
        setStatus('Error en la subida.');
      }
    }
  };

  const handleSubscribe = async () => {
    try {
      setStatus('Generando sesión de pago...');
      const response = await api.post('/billing/create-checkout-session');
      // Redirigir a la página de pago de Stripe
      window.location.href = response.data.url;
    } catch (error) {
      setStatus('Error al conectar con Stripe.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px', padding: '15px', background: '#fff3cd', border: '1px solid #ffeeba' }}>
        <h3>Estado de la Cuenta</h3>
        <p>Si tu suscripción no está activa, no podrás procesar facturas.</p>
        <button onClick={handleSubscribe} style={{ padding: '10px 20px', backgroundColor: '#6772e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Suscribirse con Stripe
        </button>
      </div>

      <div style={{ padding: '20px', border: '1px solid #ccc' }}>
        <h2>Subir Facturas (ZIP o PDF múltiple)</h2>
        <input 
          type="file" 
          multiple 
          onChange={(e) => setFiles(e.target.files)} 
        />
        <button onClick={handleUpload} style={{ marginLeft: '10px', padding: '5px 15px' }}>
          Enviar a IA (Gemini 2.5 Flash)
        </button>
        <p><strong>Estado:</strong> {status}</p>
      </div>
      
      {batchId && (
        <div style={{ marginTop: '20px', color: 'green' }}>
          ✅ Lote {batchId} creado. Los archivos se están procesando en segundo plano.
        </div>
      )}
    </div>
  );
}

export default Upload;
