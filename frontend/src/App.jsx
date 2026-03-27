import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Upload from './pages/Upload';
import Triage from './pages/Triage';
import BatchList from './pages/BatchList';
import BatchDetail from './pages/BatchDetail';
import Mapping from './pages/Mapping';

function App() {
  return (
    <Router>
      <nav style={{ padding: '10px', background: '#eee', marginBottom: '20px' }}>
        <Link to="/" style={{ marginRight: '20px' }}>Subida</Link>
        <Link to="/batches" style={{ marginRight: '20px' }}>Mis Lotes</Link>
        <Link to="/mapping" style={{ marginRight: '20px' }}>Configuración ERP</Link>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1>SaaS B2B - AP Automation</h1>
        <Routes>
          <Route path="/" element={<Upload />} />
          <Route path="/batches" element={<BatchList />} />
          <Route path="/batch/:batchId" element={<BatchDetail />} />
          <Route path="/triage/:invoiceId" element={<Triage />} />
          <Route path="/mapping" element={<Mapping />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
