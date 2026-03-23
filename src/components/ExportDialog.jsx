import { useState, useRef, useEffect } from 'react';
import { X, Download, FileSpreadsheet, Pencil } from 'lucide-react';
import './ExportDialog.css';

export default function ExportDialog({ open, onClose, onConfirm, defaultFileName }) {
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && defaultFileName) {
      // Strip .xlsx extension for editing
      const name = defaultFileName.replace(/\.xlsx$/i, '');
      setFileName(name);
      // Focus and select the filename text after render
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [open, defaultFileName]);

  if (!open) return null;

  const displayName = fileName.trim() || 'export';
  const fullName = `${displayName}.xlsx`;

  const handleExport = () => {
    onConfirm(fullName);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleExport();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content export-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export to Excel</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body export-dialog-body">
          <div className="export-dialog-icon">
            <FileSpreadsheet size={36} strokeWidth={1.5} />
          </div>

          <label className="export-dialog-label">File Name</label>
          <div className="export-dialog-input-wrapper">
            <Pencil size={14} className="export-dialog-input-icon" />
            <input
              ref={inputRef}
              type="text"
              className="export-dialog-input"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter file name"
              spellCheck={false}
            />
            <span className="export-dialog-ext">.xlsx</span>
          </div>

          <div className="export-dialog-preview">
            <span className="export-dialog-preview-label">Will save as:</span>
            <span className="export-dialog-preview-name">{fullName}</span>
          </div>
        </div>

        <div className="modal-footer export-dialog-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-accent" onClick={handleExport} disabled={!fileName.trim()}>
            <Download size={14} />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
