import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function BatchList() {
  const [batches, setBatches] = useState([]);

  const fetchBatches = async () => {
    try {
      const res = await api.get('/upload/batches');
      setBatches(res.data);
    } catch (err) {
      console.error("Error cargando lotes", err);
    }
  };

  useEffect(() => {
    fetchBatches();
    const interval = setInterval(fetchBatches, 3000); // Polling cada 3 seg
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Mis Lotes de Facturas</h2>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>ID del Lote</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {batches.map(batch => (
            <tr key={batch.id}>
              <td>{batch.id}</td>
              <td style={{ fontWeight: 'bold', color: batch.status === 'COMPLETED' ? 'green' : 'orange' }}>
                {batch.status}
              </td>
              <td>{new Date(batch.created_at).toLocaleString()}</td>
              <td>
                <Link to={`/batch/${batch.id}`}>Ver Facturas</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BatchList;
