import { useState } from 'react';
import { X, Download } from 'lucide-react';
import './MappingModal.css';
import './PreviewModal.css';

// Detect if data is template format (has row0/row1/row2/dataRows) or raw format (has rows)
function isTemplateFormat(sheet) {
  return Array.isArray(sheet.dataRows);
}

function RawTable({ sheet }) {
  const columns = Object.keys(sheet.rows[0]);
  return (
    <>
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
    </>
  );
}

function TemplateTable({ sheet }) {
  const { row0, row1, row2, dataRows, maxCol } = sheet;
  // Find columns that have any content (headers or data)
  const activeCols = [];
  for (let c = 0; c <= maxCol; c++) {
    const hasContent = row0[c] || row1[c] || row2[c] || dataRows.some((r) => r[c]);
    if (hasContent) activeCols.push(c);
  }

  return (
    <>
      <div className="preview-info">
        <span>Sheet: <strong>{sheet.sheetName}</strong></span>
        <span className="dot">·</span>
        <span>{dataRows.length} test case(s)</span>
        <span className="dot">·</span>
        <span>{activeCols.length} active column(s)</span>
      </div>
      <div className="preview-table-wrapper">
        <table className="preview-table">
          <thead>
            <tr className="preview-row-section">
              {activeCols.map((c) => (
                <th key={c} className="preview-th-section">{row0[c] || ''}</th>
              ))}
            </tr>
            <tr className="preview-row-ndc">
              {activeCols.map((c) => (
                <th key={c} className="preview-th-ndc">{row1[c] || ''}</th>
              ))}
            </tr>
            <tr className="preview-row-flx">
              {activeCols.map((c) => (
                <th key={c} className="preview-th-flx">{row2[c] || ''}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, i) => (
              <tr key={i}>
                {activeCols.map((c) => (
                  <td key={c}>{row[c] || ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function PreviewModal({ open, onClose, data, onExport }) {
  const [activeSheet, setActiveSheet] = useState(0);

  if (!open || !data || data.length === 0) return null;

  const sheet = data[activeSheet] || data[0];

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
          {isTemplateFormat(sheet) ? (
            <TemplateTable sheet={sheet} />
          ) : (
            <RawTable sheet={sheet} />
          )}
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
