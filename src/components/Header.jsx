import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileCode2, Upload as UploadIcon, Settings, User, Upload, FileSpreadsheet } from 'lucide-react';
import { readExcelFile } from '../utils/lookupSheetCopier';
import './Header.css';

export default function Header({
  exportMode, setExportMode,
  exportFormat, setExportFormat,
  lookupWorkbook, setLookupWorkbook,
}) {
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [sourceFileName, setSourceFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!showSettings) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSettings]);

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
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <div className="logo-icon">
            <FileCode2 size={22} />
          </div>
          <span className="logo-text">XML Parser Tool</span>
        </Link>

        <nav className="header-nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <FileCode2 size={16} />
            Dashboard
          </Link>
          <Link
            to="/upload"
            className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}
          >
            <UploadIcon size={16} />
            Upload
          </Link>
        </nav>

        <div className="header-actions">
          <div className="settings-wrapper" ref={panelRef}>
            <button
              className={`icon-btn ${showSettings ? 'icon-btn-active' : ''}`}
              title="Export Settings"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings size={18} />
            </button>

            {showSettings && (
              <div className="settings-dropdown">
                <div className="settings-dropdown-title">Export Settings</div>

                <div className="settings-row">
                  <label className="settings-label">Export Mode</label>
                  <div className="settings-radio-group">
                    <label className={`settings-radio ${exportMode === 'NDC' ? 'active' : ''}`}>
                      <input type="radio" name="exportMode" value="NDC" checked={exportMode === 'NDC'} onChange={() => setExportMode('NDC')} />
                      <span className="radio-dot" />
                      NDC
                    </label>
                    <label className={`settings-radio ${exportMode === 'FLX' ? 'active' : ''}`}>
                      <input type="radio" name="exportMode" value="FLX" checked={exportMode === 'FLX'} onChange={() => setExportMode('FLX')} />
                      <span className="radio-dot" />
                      FLX
                    </label>
                  </div>
                </div>

                <div className="settings-row">
                  <label className="settings-label">Export Format</label>
                  <div className="settings-radio-group">
                    <label className={`settings-radio ${exportFormat === 'template' ? 'active' : ''}`}>
                      <input type="radio" name="exportFormat" value="template" checked={exportFormat === 'template'} onChange={() => setExportFormat('template')} />
                      <span className="radio-dot" />
                      Template
                    </label>
                    <label className={`settings-radio ${exportFormat === 'raw' ? 'active' : ''}`}>
                      <input type="radio" name="exportFormat" value="raw" checked={exportFormat === 'raw'} onChange={() => setExportFormat('raw')} />
                      <span className="radio-dot" />
                      Raw
                    </label>
                  </div>
                </div>

                {exportFormat === 'template' && (
                  <div className="settings-row">
                    <label className="settings-label">
                      <FileSpreadsheet size={12} />
                      Source Excel
                      <span className="settings-hint">(lookup sheets)</span>
                    </label>
                    <div className="settings-file-picker">
                      <label className="settings-file-btn">
                        <Upload size={12} />
                        {loading ? 'Reading...' : 'Browse'}
                        <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: 'none' }} disabled={loading} />
                      </label>
                      {sourceFileName && <span className="settings-file-name">{sourceFileName}</span>}
                      {lookupWorkbook && <span className="settings-file-status">{lookupWorkbook.SheetNames.length} sheets</span>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="icon-btn profile-btn" title="Profile">
            <User size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
