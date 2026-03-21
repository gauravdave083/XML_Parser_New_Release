import { useState } from 'react';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import { suggestColumnNames } from '../utils/xmlParser';
import './MappingModal.css';

export default function MappingModal({ open, onClose, mappings, setMappings, requests }) {
  const [activeTab, setActiveTab] = useState('manual');

  if (!open) return null;

  const addRow = () => {
    setMappings([...mappings, { xpath: '', column: '' }]);
  };

  const removeRow = (index) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, value) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], [field]: value };
    setMappings(updated);
  };

  const autoSuggest = () => {
    const allSuggestions = [];
    const seenCols = new Set();
    for (const req of requests) {
      if (req.enabled && req.xml.trim()) {
        const suggestions = suggestColumnNames(req.xml);
        for (const s of suggestions) {
          if (!seenCols.has(s.column)) {
            seenCols.add(s.column);
            allSuggestions.push(s);
          }
        }
      }
    }
    if (allSuggestions.length > 0) {
      setMappings(allSuggestions);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content mapping-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Mapping Configuration</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            Manual Mapping
          </button>
          <button
            className={`modal-tab ${activeTab === 'auto' ? 'active' : ''}`}
            onClick={() => setActiveTab('auto')}
          >
            <Sparkles size={14} />
            Auto-Detect
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'auto' && (
            <div className="auto-detect-section">
              <p className="auto-desc">
                Automatically detect XML nodes and suggest Excel column mappings from your pasted XML data.
              </p>
              <button className="btn btn-accent" onClick={autoSuggest}>
                <Sparkles size={14} />
                Auto-Detect Columns
              </button>
            </div>
          )}

          <div className="mapping-table">
            <div className="mapping-header-row">
              <span className="mapping-col-header">XML Node Path (XPath)</span>
              <span className="mapping-col-header">Excel Column Name</span>
              <span className="mapping-col-header action-col"></span>
            </div>
            {mappings.length === 0 && (
              <div className="mapping-empty">
                No mapping rules defined. Add a row or use auto-detect.
              </div>
            )}
            {mappings.map((m, i) => (
              <div className="mapping-row" key={i}>
                <input
                  type="text"
                  className="mapping-input"
                  placeholder="/Envelope/Body/..."
                  value={m.xpath}
                  onChange={(e) => updateRow(i, 'xpath', e.target.value)}
                />
                <input
                  type="text"
                  className="mapping-input"
                  placeholder="ColumnName"
                  value={m.column}
                  onChange={(e) => updateRow(i, 'column', e.target.value)}
                />
                <button className="btn-icon-sm danger" onClick={() => removeRow(i)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button className="btn btn-outline add-row-btn" onClick={addRow}>
            <Plus size={14} />
            Add Row
          </button>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-accent" onClick={onClose}>Save Mappings</button>
        </div>
      </div>
    </div>
  );
}
