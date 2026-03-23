import { useState } from 'react';
import { Plus, Eye, Rocket, Trash2, ClipboardList, X } from 'lucide-react';
import XmlBlock from '../components/XmlBlock';
import MappingModal from '../components/MappingModal';
import PreviewModal from '../components/PreviewModal';
import ExportDialog from '../components/ExportDialog';
import { generatePreviewData, exportToExcel } from '../utils/xmlParser';
import { generateTemplatePreviewData, exportTemplateToExcel } from '../utils/templateExport';
import './Dashboard.css';

export default function Dashboard({
  requestTabs, setRequestTabs, testCases, setTestCases,
  exportMode, exportFormat, lookupWorkbook,
}) {
  const [activeTC, setActiveTC] = useState(0);
  const [mappings, setMappings] = useState([]);
  const [showMapping, setShowMapping] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [newRequestName, setNewRequestName] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTCId, setNewTCId] = useState('');
  const [showAddTC, setShowAddTC] = useState(false);
  const [editingTCIndex, setEditingTCIndex] = useState(null);
  const [editTCValue, setEditTCValue] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [defaultExportName, setDefaultExportName] = useState('');

  const currentTC = testCases[activeTC] || testCases[0];

  // --- Test Case helpers ---
  const handleAddTC = () => {
    const id = newTCId.trim();
    if (!id) return;
    setTestCases([...testCases, { id, data: {} }]);
    setActiveTC(testCases.length);
    setNewTCId('');
    setShowAddTC(false);
  };

  const handleRemoveTC = (index) => {
    if (testCases.length <= 1) return;
    const updated = testCases.filter((_, i) => i !== index);
    setTestCases(updated);
    if (activeTC >= updated.length) setActiveTC(updated.length - 1);
    else if (activeTC === index) setActiveTC(0);
  };

  const handleRenameTCSubmit = (index) => {
    const val = editTCValue.trim();
    if (val) {
      const updated = [...testCases];
      updated[index] = { ...updated[index], id: val };
      setTestCases(updated);
    }
    setEditingTCIndex(null);
    setEditTCValue('');
  };

  // --- Request Tab helpers ---
  const handleAddRequest = () => {
    const name = newRequestName.trim();
    if (!name) return;
    setRequestTabs([...requestTabs, { name, enabled: true }]);
    setNewRequestName('');
    setShowAddInput(false);
  };

  const handleRemoveRequest = (index) => {
    if (requestTabs.length <= 1) return;
    const removedName = requestTabs[index].name;
    setRequestTabs(requestTabs.filter((_, i) => i !== index));
    // Clean up data from all test cases
    setTestCases(testCases.map((tc) => {
      const newData = { ...tc.data };
      delete newData[removedName];
      return { ...tc, data: newData };
    }));
  };

  const handleTabChange = (index, updates) => {
    const updated = [...requestTabs];
    const oldName = updated[index].name;
    updated[index] = { ...updated[index], ...updates };
    setRequestTabs(updated);
    // If name changed, migrate data in all test cases
    if (updates.name && updates.name !== oldName) {
      setTestCases(testCases.map((tc) => {
        const newData = { ...tc.data };
        if (newData[oldName] !== undefined) {
          newData[updates.name] = newData[oldName];
          delete newData[oldName];
        }
        return { ...tc, data: newData };
      }));
    }
  };

  // --- XML data for current test case ---
  const getXmlForTab = (tabName) => (currentTC?.data?.[tabName] || '');

  const setXmlForTab = (tabName, xml) => {
    const updated = [...testCases];
    const idx = activeTC < updated.length ? activeTC : 0;
    updated[idx] = {
      ...updated[idx],
      data: { ...updated[idx].data, [tabName]: xml },
    };
    setTestCases(updated);
  };

  // --- Build flat requests array for current TC (for XmlBlock / export) ---
  const buildRequestsForTC = (tc) =>
    requestTabs.map((tab) => ({
      name: tab.name,
      xml: tc.data[tab.name] || '',
      enabled: tab.enabled,
    }));

  // --- Preview / Export ---
  const handlePreview = () => {
    let data;
    if (exportFormat === 'template') {
      data = generateTemplatePreviewData(testCases, requestTabs, exportMode);
    } else {
      data = generatePreviewData(testCases, requestTabs, mappings);
    }
    if (data.length === 0) {
      alert('No data to preview. Paste XML in at least one enabled request block.');
      return;
    }
    setPreviewData(data);
    setShowPreview(true);
  };

  const handleExport = () => {
    // Generate a smart default filename
    const date = new Date().toISOString().slice(0, 10);
    const defaultName = exportFormat === 'template'
      ? `SSR_INST_Export_${exportMode}_${date}`
      : `XMLParsed_${date}`;
    setDefaultExportName(defaultName);
    setShowExportDialog(true);
  };

  const handleExportConfirm = (fileName) => {
    if (exportFormat === 'template') {
      exportTemplateToExcel(testCases, requestTabs, exportMode, lookupWorkbook, fileName);
    } else {
      exportToExcel(testCases, requestTabs, mappings, fileName);
    }
  };

  const currentRequests = currentTC ? buildRequestsForTC(currentTC) : [];

  return (
    <div className="dashboard">
      {/* LEFT SIDEBAR — Test Cases */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <ClipboardList size={16} />
          <span>Test Cases</span>
          <span className="sidebar-count">{testCases.length}</span>
        </div>

        <div className="tc-list">
          {testCases.map((tc, i) => (
            <div
              key={i}
              className={`tc-item ${i === activeTC ? 'active' : ''}`}
              onClick={() => setActiveTC(i)}
            >
              {editingTCIndex === i ? (
                <input
                  className="tc-rename-input"
                  value={editTCValue}
                  onChange={(e) => setEditTCValue(e.target.value)}
                  onBlur={() => handleRenameTCSubmit(i)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenameTCSubmit(i); if (e.key === 'Escape') { setEditingTCIndex(null); setEditTCValue(''); } }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <span
                  className="tc-id"
                  onDoubleClick={(e) => { e.stopPropagation(); setEditingTCIndex(i); setEditTCValue(tc.id); }}
                >
                  {tc.id}
                </span>
              )}
              {testCases.length > 1 && (
                <button
                  className="tc-remove"
                  onClick={(e) => { e.stopPropagation(); handleRemoveTC(i); }}
                  title="Remove test case"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        {showAddTC ? (
          <div className="tc-add-row">
            <input
              className="tc-add-input"
              placeholder="TC-002"
              value={newTCId}
              onChange={(e) => setNewTCId(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTC(); if (e.key === 'Escape') { setShowAddTC(false); setNewTCId(''); } }}
              autoFocus
            />
            <button className="btn btn-accent btn-sm" onClick={handleAddTC} disabled={!newTCId.trim()}>Add</button>
          </div>
        ) : (
          <button className="tc-add-btn" onClick={() => setShowAddTC(true)}>
            <Plus size={14} />
            Add Test Case
          </button>
        )}
      </aside>

      {/* MAIN CONTENT — Request Blocks */}
      <main className="main-content">
        <div className="main-top-bar">
          <div>
            <h2 className="main-title">
              SOAP Request Blocks
              <span className="main-tc-badge">{currentTC?.id}</span>
            </h2>
            <span className="main-subtitle">Paste XML content for each request — shared across all test cases</span>
          </div>
        </div>

        <div className="xml-blocks-grid">
          {requestTabs.map((tab, i) => (
            <div className="xml-block-wrapper" key={i}>
              <XmlBlock
                index={i}
                name={tab.name}
                xml={getXmlForTab(tab.name)}
                enabled={tab.enabled}
                onChange={(updates) => {
                  if (updates.xml !== undefined) {
                    setXmlForTab(tab.name, updates.xml);
                  }
                  if (updates.name !== undefined || updates.enabled !== undefined) {
                    handleTabChange(i, updates);
                  }
                }}
              />
              {requestTabs.length > 1 && (
                <button
                  className="remove-block-btn"
                  onClick={() => handleRemoveRequest(i)}
                  title="Remove this request"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Request */}
        {showAddInput ? (
          <div className="add-request-row">
            <input
              type="text"
              className="add-request-input"
              placeholder="Enter request name (e.g., SearchRequest)"
              value={newRequestName}
              onChange={(e) => setNewRequestName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddRequest(); if (e.key === 'Escape') { setShowAddInput(false); setNewRequestName(''); } }}
              autoFocus
            />
            <button className="btn btn-accent btn-sm" onClick={handleAddRequest} disabled={!newRequestName.trim()}>
              Add
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddInput(false); setNewRequestName(''); }}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn btn-outline add-request-btn" onClick={() => setShowAddInput(true)}>
            <Plus size={14} />
            Add Request Block
          </button>
        )}

        {/* Action Bar */}
        <section className="action-bar">
          <div className="action-bar-inner">
            <div className="action-group">
              <button className="btn btn-outline" onClick={() => setShowMapping(true)}>
                <Plus size={14} />
                Mapping Rules
              </button>
              <button className="btn btn-outline" onClick={handlePreview}>
                <Eye size={14} />
                Preview
              </button>
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleExport}>
              <Rocket size={16} />
              Parse & Export to Excel
            </button>
          </div>
        </section>
      </main>

      <MappingModal
        open={showMapping}
        onClose={() => setShowMapping(false)}
        mappings={mappings}
        setMappings={setMappings}
        requests={currentRequests}
      />

      <PreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        data={previewData}
        onExport={handleExport}
      />

      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onConfirm={handleExportConfirm}
        defaultFileName={defaultExportName}
      />
    </div>
  );
}
