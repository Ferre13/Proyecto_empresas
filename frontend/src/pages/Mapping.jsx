import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useLanguage } from '../context/LanguageContext';

const theme = {
  surface: 'var(--surface)',
  text: 'var(--text)',
  textSecondary: 'var(--text-sec)',
  accent: 'var(--accent)',
  border: 'var(--border)',
  shadow: 'var(--shadow)',
  radius: '16px',
  radiusSmall: '12px',
  bg: 'var(--bg)',
  success: 'var(--success)',
  error: 'var(--error)',
  warning: 'var(--warning)'
};

export const FALLBACK_ERP_TEMPLATES = [
  {
    id: 'quickbooks',
    erp_name: 'QuickBooks Online',
    region: 'US / UK / Global',
    badge: '🇺🇸 🇬🇧',
    config: {
      InvoiceNo: 'invoice_number',
      InvoiceDate: 'issue_date',
      DueDate: 'due_date',
      Vendor: 'supplier_name',
      VendorTaxId: 'supplier_tax_id',
      Customer: 'customer_name',
      NetAmount: 'subtotal',
      TaxAmount: 'tax_amount',
      TotalAmount: 'total_amount',
      CurrencyCode: 'currency',
    }
  },
  {
    id: 'xero',
    erp_name: 'Xero',
    region: 'UK / US / AU',
    badge: '🇬🇧 🇺🇸',
    config: {
      '*ContactName': 'supplier_name',
      ContactTaxNumber: 'supplier_tax_id',
      '*InvoiceNumber': 'invoice_number',
      '*InvoiceDate': 'issue_date',
      '*DueDate': 'due_date',
      SubTotal: 'subtotal',
      TotalTax: 'tax_amount',
      '*Total': 'total_amount',
      Currency: 'currency',
    }
  },
  {
    id: 'sap_b1',
    erp_name: 'SAP Business One',
    region: 'Global Enterprise',
    badge: '🌐',
    config: {
      DocNum: 'invoice_number',
      DocDate: 'issue_date',
      DocDueDate: 'due_date',
      CardName: 'supplier_name',
      LicTradNum: 'supplier_tax_id',
      DocTotalNet: 'subtotal',
      VatSum: 'tax_amount',
      WTAmnt: 'retention_amount',
      DocTotal: 'total_amount',
      DocCur: 'currency',
    }
  },
  {
    id: 'sage',
    erp_name: 'Sage 50 / Intacct',
    region: 'UK / US / EU',
    badge: '🇬🇧 🇪🇺',
    config: {
      Reference: 'invoice_number',
      Date: 'issue_date',
      Due_Date: 'due_date',
      Account_Name: 'supplier_name',
      VAT_Registration: 'supplier_tax_id',
      Net_Amount: 'subtotal',
      Tax_Amount: 'tax_amount',
      Gross_Amount: 'total_amount',
      Currency_Code: 'currency',
    }
  },
  {
    id: 'netsuite',
    erp_name: 'Oracle NetSuite',
    region: 'US / Global',
    badge: '🇺🇸 🌐',
    config: {
      ExternalID: 'invoice_number',
      TranDate: 'issue_date',
      DueDate: 'due_date',
      VendorName: 'supplier_name',
      VendorTaxRegNum: 'supplier_tax_id',
      CustomerName: 'customer_name',
      SubtotalAmount: 'subtotal',
      TaxTotal: 'tax_amount',
      WithholdingTax: 'retention_amount',
      Total: 'total_amount',
      Currency: 'currency',
    }
  },
  {
    id: 'holded',
    erp_name: 'Holded',
    region: 'ES / EU',
    badge: '🇪🇸 🇪🇺',
    config: {
      NumFactura: 'invoice_number',
      FechaEmision: 'issue_date',
      FechaVencimiento: 'due_date',
      ContactoNombre: 'supplier_name',
      ContactoNIF: 'supplier_tax_id',
      Subtotal: 'subtotal',
      IVA: 'tax_amount',
      RetencionIRPF: 'retention_amount',
      Total: 'total_amount',
      Moneda: 'currency',
    }
  },
  {
    id: 'a3_wolters',
    erp_name: 'A3 / Wolters Kluwer',
    region: 'ES Asesorías',
    badge: '🇪🇸',
    config: {
      N_FACTURA: 'invoice_number',
      FECHA_EXP: 'issue_date',
      FECHA_VTO: 'due_date',
      NOMBRE_PROV: 'supplier_name',
      NIF_PROVEEDOR: 'supplier_tax_id',
      BASE_IMPONIBLE: 'subtotal',
      CUOTA_IVA: 'tax_amount',
      CUOTA_IRPF: 'retention_amount',
      TOTAL_FACTURA: 'total_amount',
      DIVISA: 'currency',
    }
  },
];

const CANONICAL_FIELDS = [
  { id: 'invoice_number', defaultHeader: 'InvoiceNo', hint: 'InvoiceNo, NumFactura, DocNum...' },
  { id: 'issue_date', defaultHeader: 'InvoiceDate', hint: 'InvoiceDate, FechaEmision, DocDate...' },
  { id: 'due_date', defaultHeader: 'DueDate', hint: 'DueDate, Vencimiento, DocDueDate...' },
  { id: 'supplier_name', defaultHeader: 'VendorName', hint: 'Vendor, Proveedor, CardName...' },
  { id: 'supplier_tax_id', defaultHeader: 'VendorTaxId', hint: 'VendorTaxId, VAT_Registration, NIF...' },
  { id: 'customer_name', defaultHeader: 'CustomerName', hint: 'Customer, Cliente...' },
  { id: 'customer_tax_id', defaultHeader: 'CustomerTaxId', hint: 'CustomerTaxId, NIFCliente...' },
  { id: 'subtotal', defaultHeader: 'NetAmount', hint: 'NetAmount, SubTotal, BaseImponible...' },
  { id: 'tax_amount', defaultHeader: 'TaxAmount', hint: 'TaxAmount, TotalTax, IVA...' },
  { id: 'retention_amount', defaultHeader: 'WithholdingTax', hint: 'WithholdingTax, RetencionIRPF, WTAmnt...' },
  { id: 'total_amount', defaultHeader: 'TotalAmount', hint: 'TotalAmount, Gross_Amount, Total...' },
  { id: 'currency', defaultHeader: 'Currency', hint: 'Currency, CurrencyCode, Divisa...' },
];

function Mapping() {
  const { t } = useLanguage();
  const [erpName, setErpName] = useState('QuickBooks Online');
  const [mode, setMode] = useState('manual');
  const [status, setStatus] = useState('');
  const [detectedHeaders, setDetectedHeaders] = useState([]);
  const [excelMapping, setExcelMapping] = useState({});
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [templates, setTemplates] = useState(FALLBACK_ERP_TEMPLATES);
  const [savedMappings, setSavedMappings] = useState([]);

  const [manualFields, setManualFields] = useState(
    CANONICAL_FIELDS.map((f, index) => ({
      ...f,
      customLabel: f.defaultHeader,
      active: true,
      order: index
    }))
  );

  const applyConfigToEditor = (name, config) => {
    if (name) setErpName(name);
    if (!config || Object.keys(config).length === 0) return;

    const mappedIds = new Set();
    const reorderedFields = [];

    Object.entries(config).forEach(([customCol, canonicalId]) => {
      const original = CANONICAL_FIELDS.find(f => f.id === canonicalId);
      if (original) {
        mappedIds.add(canonicalId);
        reorderedFields.push({
          ...original,
          customLabel: customCol,
          active: true
        });
      }
    });

    CANONICAL_FIELDS.forEach(f => {
      if (!mappedIds.has(f.id)) {
        reorderedFields.push({
          ...f,
          customLabel: f.defaultHeader,
          active: false
        });
      }
    });

    setManualFields(reorderedFields);
    setMode('manual');
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const tplRes = await api.get('/mappings/templates').catch(() => null);
        if (tplRes?.data && Array.isArray(tplRes.data) && tplRes.data.length > 0) {
          setTemplates(tplRes.data);
        }
      } catch (e) {}

      try {
        const res = await api.get('/mappings/');
        let mappingsList = Array.isArray(res.data) ? res.data : [];

        // Si no hay en el servidor local, revisar si el usuario tiene guardadas en Supabase Cloud
        if (mappingsList.length === 0 && isSupabaseConfigured() && supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          const cloudMappings = user?.user_metadata?.erp_mappings;
          if (Array.isArray(cloudMappings) && cloudMappings.length > 0) {
            mappingsList = cloudMappings;
            // Sincronizar con el backend
            for (const item of cloudMappings) {
              if (item.erp_name && item.config) {
                await api.post('/mappings/', { erp_name: item.erp_name, config: item.config }).catch(() => {});
              }
            }
          }
        }

        setSavedMappings(mappingsList);
        if (mappingsList.length > 0) {
          const first = mappingsList[0];
          applyConfigToEditor(first.erp_name, first.config);
        } else {
          // Por defecto cargar QuickBooks Online en el editor
          applyConfigToEditor(FALLBACK_ERP_TEMPLATES[0].erp_name, FALLBACK_ERP_TEMPLATES[0].config);
        }
      } catch (err) {
        console.error("Error loading mappings:", err);
      }
    };
    fetchInitialData();
  }, []);

  const handleSelectPreset = (preset) => {
    applyConfigToEditor(preset.erp_name, preset.config);
    setStatus(`⚡ ${t.mapping.loadPresetMsg} ${preset.erp_name} (${preset.region}). ${t.mapping.clickSaveToPersist}`);
  };

  const handleSelectSaved = (saved) => {
    applyConfigToEditor(saved.erp_name, saved.config);
    setStatus(`☁️ ${t.mapping.loadPresetMsg} ${saved.erp_name}`);
  };

  const handleDeleteSaved = async (e, nameToDelete) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/mappings/${encodeURIComponent(nameToDelete)}`);
      const updated = res.data?.mappings || savedMappings.filter(m => m.erp_name !== nameToDelete);
      setSavedMappings(updated);

      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.updateUser({
          data: { erp_mappings: updated }
        }).catch(() => {});
      }
      setStatus(t.mapping.deletedMsg);
    } catch (err) {
      setSavedMappings(savedMappings.filter(m => m.erp_name !== nameToDelete));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setStatus(t.mapping.analyzingFile);
      const res = await api.post('/mappings/detect-headers', formData);
      setDetectedHeaders(res.data.columns);
      setStatus(t.mapping.headersDetected);
    } catch (err) {
      setStatus(t.mapping.fileReadError);
    }
  };

  const handleManualToggle = (id) => {
    setManualFields(manualFields.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const handleManualLabelChange = (id, newLabel) => {
    setManualFields(manualFields.map(f => f.id === id ? { ...f, customLabel: newLabel } : f));
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newFields = [...manualFields];
    const item = newFields.splice(draggedIndex, 1)[0];
    newFields.splice(index, 0, item);
    setManualFields(newFields);
    setDraggedIndex(null);
  };

  const handleSave = async (isManual) => {
    try {
      setStatus(t.mapping.savingConfig);
      const config = {};
      if (isManual) {
        manualFields.filter(f => f.active).forEach(f => {
          config[f.customLabel || f.defaultHeader] = f.id;
        });
      } else {
        Object.entries(excelMapping).forEach(([k, v]) => {
          if (v) config[k] = v;
        });
      }

      const cleanName = (erpName || 'Custom ERP').trim();
      const res = await api.post('/mappings/', { erp_name: cleanName, config });

      const updatedList = res.data?.mappings || [
        { erp_name: cleanName, config },
        ...savedMappings.filter(m => m.erp_name !== cleanName)
      ];
      setSavedMappings(updatedList);

      // Persistir también directamente en Supabase Auth user_metadata del usuario
      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.updateUser({
          data: {
            erp_mappings: updatedList,
            active_erp: cleanName
          }
        }).catch(() => {});
      }

      setStatus(t.mapping.savedSuccess);
    } catch (err) {
      setStatus(t.mapping.saveError);
    }
  };

  const cardStyle = {
    background: theme.surface,
    padding: '32px',
    borderRadius: theme.radius,
    boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`,
    marginBottom: '28px'
  };

  const buttonStyle = (disabled = false) => ({
    padding: '12px 20px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    pointerEvents: disabled ? 'none' : 'auto'
  });

  const textInputStyle = {
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.bg,
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: theme.text,
    width: '100%',
    outline: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flex: 1,
    boxSizing: 'border-box'
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .config-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
          background-color: var(--surface);
        }
        .grip-handle {
          cursor: grab;
          color: var(--text-sec);
          display: flex;
          align-items: center;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .grip-handle:hover {
          background-color: var(--border);
          color: var(--text);
        }
        .grip-handle:active {
          cursor: grabbing;
        }
        .manual-field-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 24px;
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .manual-field-card:hover {
          border-color: var(--accent);
          box-shadow: 0 4px 14px rgba(0, 122, 255, 0.06);
        }
        .erp-preset-btn {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg);
          cursor: pointer;
          text-align: left;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .erp-preset-btn:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 122, 255, 0.08);
        }
      `}</style>

      {/* Sección 1: Plantillas ERP Oficiales Preconfiguradas (UK, US, EU, ES) */}
      <div style={cardStyle}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px 0', color: theme.text }}>
            {t.mapping.presetsTitle}
          </h3>
          <p style={{ color: theme.textSecondary, fontSize: '13px', margin: 0 }}>
            {t.mapping.presetsSubtitle}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '12px'
        }}>
          {templates.map((tpl) => {
            const isSelected = erpName.toLowerCase() === tpl.erp_name.toLowerCase();
            return (
              <button
                key={tpl.id}
                type="button"
                className="erp-preset-btn"
                onClick={() => handleSelectPreset(tpl)}
                style={{
                  borderColor: isSelected ? theme.accent : theme.border,
                  backgroundColor: isSelected ? 'rgba(0, 122, 255, 0.06)' : 'var(--bg)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>{tpl.badge}</span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? theme.accent : 'var(--surface)',
                    color: isSelected ? '#FFF' : theme.textSecondary,
                    border: `1px solid ${isSelected ? theme.accent : theme.border}`
                  }}>
                    {tpl.region}
                  </span>
                </div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: theme.text }}>
                  {tpl.erp_name}
                </div>
                <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '4px' }}>
                  {Object.keys(tpl.config || {}).length} cols
                </div>
              </button>
            );
          })}
        </div>

        {/* Configuraciones Guardadas en la Nube del Usuario */}
        {savedMappings.length > 0 && (
          <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: `1px solid ${theme.border}` }}>
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 4px 0', color: theme.text }}>
                {t.mapping.savedConfigsTitle}
              </h4>
              <p style={{ fontSize: '12px', color: theme.textSecondary, margin: 0 }}>
                {t.mapping.savedConfigsSubtitle}
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {savedMappings.map((saved, idx) => {
                const isCurrent = erpName === saved.erp_name;
                return (
                  <div
                    key={saved.erp_name}
                    onClick={() => handleSelectSaved(saved)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 14px',
                      borderRadius: '12px',
                      border: `1px solid ${isCurrent ? theme.accent : theme.border}`,
                      backgroundColor: isCurrent ? 'rgba(0, 122, 255, 0.08)' : 'var(--bg)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: theme.text
                    }}
                  >
                    <span>☁️ {saved.erp_name}</span>
                    {idx === 0 && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(52, 199, 89, 0.14)',
                        color: theme.success
                      }}>
                        {t.mapping.activeBadge}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSaved(e, saved.erp_name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.textSecondary,
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '2px 4px',
                        lineHeight: 1
                      }}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sección 2: Editor de Columnas */}
      <div style={cardStyle}>
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.03em', margin: '0 0 6px 0', color: theme.text }}>
            {t.mapping.title}
          </h2>
          <p style={{ color: theme.textSecondary, fontSize: '14px', margin: '0 0 24px 0', lineHeight: '1.5' }}>
            {t.mapping.subtitle}
          </p>

          <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.textSecondary }}>
            {t.mapping.configNameLabel}
          </label>
          <input
            type="text"
            className="config-input"
            value={erpName}
            onChange={(e) => setErpName(e.target.value)}
            style={{ ...textInputStyle, padding: '14px 18px', fontSize: '15px', fontWeight: '700' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', backgroundColor: 'var(--bg)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <button onClick={() => setMode('manual')} style={{ ...buttonStyle(), flex: 1, backgroundColor: mode === 'manual' ? theme.surface : 'transparent', color: mode === 'manual' ? theme.accent : theme.textSecondary, boxShadow: mode === 'manual' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
            {t.mapping.tabManual}
          </button>
          <button onClick={() => setMode('excel')} style={{ ...buttonStyle(), flex: 1, backgroundColor: mode === 'excel' ? theme.surface : 'transparent', color: mode === 'excel' ? theme.accent : theme.textSecondary, boxShadow: mode === 'excel' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
            {t.mapping.tabExcel}
          </button>
        </div>

        {status && (
          <div style={{
            marginBottom: '24px',
            padding: '14px 18px',
            borderRadius: '12px',
            backgroundColor: status.includes('Error') || status.includes('Fehler') || status.includes('Erreur') ? 'rgba(255, 59, 48, 0.06)' : 'rgba(0, 122, 255, 0.06)',
            color: status.includes('Error') || status.includes('Fehler') || status.includes('Erreur') ? theme.error : theme.accent,
            fontSize: '13px',
            fontWeight: '600',
            textAlign: 'center',
            border: `1px solid ${status.includes('Error') ? 'rgba(255, 59, 48, 0.15)' : 'rgba(0, 122, 255, 0.15)'}`
          }}>
            {status}
          </div>
        )}

        {mode === 'manual' ? (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: theme.text }}>
                  {t.mapping.includedColsTitle}
                </h4>
                <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: '500' }}>
                  {t.mapping.dragHint}
                </span>
              </div>

              {manualFields.map((field, index) => {
                if (!field.active) return null;
                const translatedLabel = t.mapping.canonicalLabels?.[field.id] || field.id;
                return (
                  <div
                    key={field.id}
                    className="manual-field-card"
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    style={{
                      opacity: draggedIndex === index ? 0.4 : 1,
                      transform: draggedIndex === index ? 'scale(0.98)' : 'scale(1)'
                    }}
                  >
                    <div
                      className="grip-handle"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, index)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="12" r="0.8"></circle>
                        <circle cx="9" cy="5" r="0.8"></circle>
                        <circle cx="9" cy="19" r="0.8"></circle>
                        <circle cx="15" cy="12" r="0.8"></circle>
                        <circle cx="15" cy="5" r="0.8"></circle>
                        <circle cx="15" cy="19" r="0.8"></circle>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: theme.text }}>
                          {translatedLabel}
                        </span>
                        <span style={{ fontSize: '11px', color: theme.success, fontWeight: '700', backgroundColor: 'rgba(52, 199, 89, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                          {t.mapping.includedBadge}
                        </span>
                      </div>
                      <input
                        type="text"
                        className="config-input"
                        value={field.customLabel}
                        onChange={(e) => handleManualLabelChange(field.id, e.target.value)}
                        style={textInputStyle}
                        placeholder={field.hint}
                      />
                    </div>
                    <button
                      onClick={() => handleManualToggle(field.id)}
                      style={{ padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: 'transparent', color: theme.textSecondary, fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      {t.mapping.excludeBtn}
                    </button>
                  </div>
                );
              })}

              {manualFields.some(f => !f.active) && (
                <>
                  <h4 style={{ margin: '28px 0 8px 0', fontSize: '16px', fontWeight: '700', color: theme.textSecondary }}>
                    {t.mapping.excludedColsTitle}
                  </h4>
                  {manualFields.filter(f => !f.active).map((field) => {
                    const translatedLabel = t.mapping.canonicalLabels?.[field.id] || field.id;
                    return (
                      <div key={field.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: 'var(--bg)', border: `1px dashed var(--border)`, borderRadius: '14px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: theme.textSecondary }}>{translatedLabel}</div>
                          <div style={{ fontSize: '12px', color: theme.textSecondary, opacity: 0.7, marginTop: '2px' }}>{t.mapping.excludedSub}</div>
                        </div>
                        <button onClick={() => handleManualToggle(field.id)} style={{ padding: '10px 18px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.surface, color: theme.accent, fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                          {t.mapping.includeBtn}
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <button
              className="apple-btn"
              onClick={() => handleSave(true)}
              style={{ ...buttonStyle(), width: '100%', backgroundColor: theme.accent, color: '#FFF', marginTop: '32px', fontSize: '15px', height: '52px', boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)' }}
            >
              {t.mapping.saveManualBtn}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: '56px 32px', border: `2px dashed var(--border)`, borderRadius: '16px', backgroundColor: 'var(--bg)', marginBottom: '28px' }}>
              <div style={{ fontSize: '44px', marginBottom: '14px' }}>📊</div>
              <p style={{ fontWeight: '700', color: theme.text, margin: '0 0 6px 0', fontSize: '16px' }}>{t.mapping.uploadSampleTitle}</p>
              <p style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '20px' }}>{t.mapping.uploadSampleSub}</p>
              <input type="file" onChange={handleFileChange} style={{ fontSize: '14px', fontWeight: '600', color: theme.accent }} />
            </div>

            {detectedHeaders.length > 0 && (
              <div style={{ textAlign: 'left', animation: 'fadeIn 0.3s ease-out' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0 16px 8px 16px', color: theme.textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.mapping.colInErp}</th>
                      <th style={{ textAlign: 'left', padding: '0 16px 8px 16px', color: theme.textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.mapping.colAiField}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detectedHeaders.map(col => (
                      <tr key={col}>
                        <td style={{ padding: '14px 18px', fontWeight: '700', fontSize: '14px', backgroundColor: 'var(--bg)', borderRadius: '12px 0 0 12px', border: `1px solid var(--border)`, borderRight: 'none' }}>{col}</td>
                        <td style={{ padding: '14px 18px', backgroundColor: 'var(--bg)', borderRadius: '0 12px 12px 0', border: `1px solid var(--border)`, borderLeft: 'none' }}>
                          <select onChange={(e) => setExcelMapping({ ...excelMapping, [col]: e.target.value })} style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid var(--border)`, backgroundColor: theme.surface, width: '100%', color: theme.text, fontSize: '14px', fontWeight: '600', outline: 'none' }}>
                            <option value="">{t.mapping.discardCol}</option>
                            {CANONICAL_FIELDS.map(cf => (
                              <option key={cf.id} value={cf.id}>
                                {t.mapping.canonicalLabels?.[cf.id] || cf.id}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="apple-btn" onClick={() => handleSave(false)} style={{ ...buttonStyle(), width: '100%', backgroundColor: theme.accent, color: '#FFF', marginTop: '28px', fontSize: '15px', height: '52px', boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)' }}>
                  {t.mapping.saveExcelBtn}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Mapping;
