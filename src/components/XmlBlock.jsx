import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Pencil, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import { validateXml, detectSoapEnvelope } from '../utils/xmlParser';
import './XmlBlock.css';

export default function XmlBlock({ index, name, xml, enabled, onChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const [validation, setValidation] = useState({ valid: false, error: null, checked: false });
  const [isSoap, setIsSoap] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const nameInputRef = useRef(null);

  useEffect(() => { setEditName(name); }, [name]);
  useEffect(() => { if (editing && nameInputRef.current) nameInputRef.current.focus(); }, [editing]);

  useEffect(() => {
    if (xml && xml.trim()) {
      const result = validateXml(xml);
      setValidation({ ...result, checked: true });
      setIsSoap(detectSoapEnvelope(xml));
    } else {
      setValidation({ valid: false, error: null, checked: false });
      setIsSoap(false);
    }
  }, [xml]);

  const handleToggle = () => {
    onChange({ enabled: !enabled });
  };

  const handleXmlChange = (e) => {
    onChange({ xml: e.target.value });
  };

  const statusIcon = () => {
    if (!validation.checked) return null;
    if (validation.valid) {
      return <CheckCircle2 size={14} className="status-icon valid" />;
    }
    return <XCircle size={14} className="status-icon invalid" />;
  };

  return (
    <div className={`xml-block ${!enabled ? 'disabled' : ''} ${validation.checked && !validation.valid && xml.trim() ? 'has-error' : ''}`}>
      <div className="xml-block-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="xml-block-title-row">
          <span className="xml-block-number">Request {index + 1}</span>
          {editing ? (
            <input
              ref={nameInputRef}
              className="xml-block-name-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => { onChange({ name: editName.trim() || name }); setEditing(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { onChange({ name: editName.trim() || name }); setEditing(false); } if (e.key === 'Escape') { setEditName(name); setEditing(false); } }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="xml-block-name" onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}>
              {name}
              <button className="edit-name-btn" onClick={(e) => { e.stopPropagation(); setEditing(true); }} title="Rename">
                <Pencil size={12} />
              </button>
            </span>
          )}
          {statusIcon()}
          {isSoap && <span className="soap-badge">SOAP</span>}
        </div>
        <div className="xml-block-controls">
          <button
            className={`toggle-btn ${enabled ? 'on' : 'off'}`}
            onClick={(e) => { e.stopPropagation(); handleToggle(); }}
            title={enabled ? 'Disable' : 'Enable'}
          >
            {enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </div>

      {!collapsed && (
        <div className="xml-block-body">
          <textarea
            className="xml-textarea"
            placeholder={`Paste ${name} XML here...`}
            value={xml}
            onChange={handleXmlChange}
            disabled={!enabled}
            spellCheck={false}
          />
          {validation.checked && !validation.valid && xml.trim() && (
            <div className="xml-error">
              <XCircle size={12} />
              <span>{validation.error}</span>
            </div>
          )}
          {validation.checked && validation.valid && (
            <div className="xml-valid">
              <CheckCircle2 size={12} />
              <span>Valid XML{isSoap ? ' — SOAP Envelope detected' : ''}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
