import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

function BatchDetail() {
  const { batchId } = useParams();
  const [invoices, setInvoices] = useState([]);
  const [erpName, setErpName] = useState('SAP'); // ERP por defecto para pruebas

  useEffect(() => {
    const fetchInvoices = async () => {
      const res = await api.get(`/upload/batches/${batchId}/invoices`);
      setInvoices(res.data);
    };
    fetchInvoices();
    const interval = setInterval(fetchInvoices, 3000);
    return () => clearInterval(interval);
  }, [batchId]);

  const handleDownload = async () => {
    try {
      // Llamar al endpoint de exportación y descargar el archivo binario
      const response = await api.get(`/mappings/export/${batchId}?erp_name=${erpName}`, {
        responseType: 'blob', // Crítico para descargar archivos
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Lote_${batchId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Error: Asegúrate de tener configurado un mapeo para este ERP y que las facturas estén validadas.");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Lote: {batchId}</h2>
        <button 
          onClick={handleDownload}
          style={{ padding: '10px 20px', backgroundColor: 'green', color: 'white', borderRadius: '5px', cursor: 'pointer' }}
        >
          📥 Descargar Excel para {erpName}
        </button>
      </div>
      
      <Link to="/batches">⬅️ Volver al listado</Link>
      
      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {invoices.map(inv => (
          <div key={inv.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', background: '#f9f9f9' }}>
            <h4>{inv.original_filename}</h4>
            <p>Estado: <span style={{ fontWeight: 'bold', color: inv.status === 'VALIDATED' ? 'green' : 'red' }}>{inv.status}</span></p>
            <Link to={`/triage/${inv.id}`}>Ver / Corregir</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BatchDetail;
