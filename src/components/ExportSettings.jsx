import { useState } from 'react';
import { Settings, Upload, FileSpreadsheet } from 'lucide-react';
import { readExcelFile } from '../utils/lookupSheetCopier';
import './ExportSettings.css';

export default function ExportSettings({
  exportMode,
  setExportMode,
  exportFormat,
  setExportFormat,
  lookupWorkbook,
  setLookupWorkbook,
}) {
  const [sourceFileName, setSourceFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const wb = await readExcelFile(file);
      setLookupWorkbook(wb);
      setSourceFileName(file.name);
    } catch (err) {
      alert('Error reading Excel file: ' + err.message);
      setLookupWorkbook(null);
      setSourceFileName('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-settings">
      <div className="export-settings-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="export-settings-title">
          <Settings size={14} />
          <span>Export Settings</span>
        </div>
        <span className="export-settings-toggle">{collapsed ? '▸' : '▾'}</span>
      </div>

      {!collapsed && (
        <div className="export-settings-body">
          <div className="export-settings-row">
            <label className="export-label">Export Mode</label>
            <div className="export-radio-group">
              <label className={`export-radio ${exportMode === 'NDC' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="exportMode"
                  value="NDC"
                  checked={exportMode === 'NDC'}
                  onChange={() => setExportMode('NDC')}
                />
                <span className="radio-dot" />
                NDC
              </label>
              <label className={`export-radio ${exportMode === 'FLX' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="exportMode"
                  value="FLX"
                  checked={exportMode === 'FLX'}
                  onChange={() => setExportMode('FLX')}
                />
                <span className="radio-dot" />
                FLX
              </label>
            </div>
          </div>

          <div className="export-settings-row">
            <label className="export-label">Export Format</label>
            <div className="export-radio-group">
              <label className={`export-radio ${exportFormat === 'template' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="exportFormat"
                  value="template"
                  checked={exportFormat === 'template'}
                  onChange={() => setExportFormat('template')}
                />
                <span className="radio-dot" />
                Template Format
              </label>
              <label className={`export-radio ${exportFormat === 'raw' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="exportFormat"
                  value="raw"
                  checked={exportFormat === 'raw'}
                  onChange={() => setExportFormat('raw')}
                />
                <span className="radio-dot" />
                Raw (Auto-extract)
              </label>
            </div>
          </div>

          {exportFormat === 'template' && (
            <div className="export-settings-row">
              <label className="export-label">
                <FileSpreadsheet size={13} />
                Source Excel
                <span className="export-hint">(for lookup sheets: PCC, FOP, ContactInfo, Travelers)</span>
              </label>
              <div className="export-file-picker">
                <label className="export-file-btn">
                  <Upload size={13} />
                  {loading ? 'Reading...' : 'Browse'}
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    disabled={loading}
                  />
                </label>
                {sourceFileName && (
                  <span className="export-file-name">{sourceFileName}</span>
                )}
                {lookupWorkbook && (
                  <span className="export-file-status">
                    {lookupWorkbook.SheetNames.length} sheets loaded
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
