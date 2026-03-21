import { useState } from 'react';
import { X, Download } from 'lucide-react';
import './MappingModal.css';
import './PreviewModal.css';

export default function PreviewModal({ open, onClose, data, onExport }) {
  const [activeSheet, setActiveSheet] = useState(0);

  if (!open || !data || data.length === 0) return null;

  const sheet = data[activeSheet] || data[0];
  const columns = Object.keys(sheet.rows[0]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Preview Output</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Sheet Tabs */}
        <div className="preview-sheet-tabs">
          {data.map((s, i) => (
            <button
              key={i}
              className={`preview-sheet-tab ${i === activeSheet ? 'active' : ''}`}
              onClick={() => setActiveSheet(i)}
            >
              {s.sheetName}
            </button>
          ))}
        </div>

        <div className="modal-body">
          <div className="preview-info">
            <span>Sheet: <strong>{sheet.sheetName}</strong></span>
            <span className="dot">·</span>
            <span>{sheet.rows.length} row(s)</span>
            <span className="dot">·</span>
            <span>{columns.length} column(s)</span>
          </div>

          <div className="preview-table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((row, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col}>{row[col] || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <span className="preview-footer-info">{data.length} sheet(s) will be exported</span>
          <div className="modal-footer-buttons">
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
            <button className="btn btn-accent" onClick={onExport}>
              <Download size={14} />
              Export to Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
