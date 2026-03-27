import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

function Triage() {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchInvoice = async () => {
      const res = await api.get(`/invoices/${invoiceId}`);
      setInvoice(res.data);
      setFormData(res.data.extracted_data || {});
    };
    fetchInvoice();
  }, [invoiceId]);

  const handleSave = async () => {
    await api.put(`/invoices/${invoiceId}`, { extracted_data: formData, status: 'VALIDATED' });
    alert('Factura Validada Correctamente');
  };

  if (!invoice) return <div>Cargando factura para triaje...</div>;

  return (
    <div style={{ display: 'flex', height: '90vh' }}>
      {/* Lado Izquierdo: Visor de PDF */}
      <div style={{ flex: 1, borderRight: '2px solid #000' }}>
        <iframe 
          src={`http://localhost:8000/files/${invoiceId}`} 
          width="100%" 
          height="100%" 
          title="PDF Viewer"
        />
      </div>

      {/* Lado Derecho: Inputs de IA para Corrección Humana */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <h3>Corrección Humana (Triaje)</h3>
        {Object.keys(formData).map((key) => (
          key !== 'line_items' && (
            <div key={key} style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontWeight: 'bold' }}>{key}</label>
              <input 
                type="text" 
                value={formData[key] || ''} 
                onChange={(e) => setFormData({...formData, [key]: e.target.value})}
                style={{ width: '100%' }}
              />
            </div>
          )
        ))}
        <button 
          onClick={handleSave} 
          style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: 'green', color: 'white' }}
        >
          Guardar y Validar
        </button>
      </div>
    </div>
  );
}

export default Triage;
