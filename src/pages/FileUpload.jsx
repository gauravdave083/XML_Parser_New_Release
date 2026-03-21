import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileUp, AlertTriangle, CheckCircle2, ArrowLeft, FileCode2 } from 'lucide-react';
import { validateXml, detectRequestTypes, detectSoapEnvelope } from '../utils/xmlParser';
import './FileUpload.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function FileUpload({ onAutoFill }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error' | 'warning'
  const [message, setMessage] = useState('');
  const [detectedRequests, setDetectedRequests] = useState([]);

  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xml')) {
      setStatus('error');
      setMessage('Invalid file type. Please upload a .xml file.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setStatus('error');
      setMessage(`File too large (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`);
      return;
    }

    setFile(selectedFile);
    setStatus('loading');
    setMessage('Parsing XML file...');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setFileContent(content);

      const validation = validateXml(content);
      if (!validation.valid) {
        setStatus('error');
        setMessage(`Invalid XML: ${validation.error}`);
        return;
      }

      const isSoap = detectSoapEnvelope(content);
      const detected = detectRequestTypes(content);

      if (detected.length > 0) {
        setDetectedRequests(detected);
        setStatus('success');
        setMessage(`Detected ${detected.length} request type(s)${isSoap ? ' in SOAP Envelope' : ''}.`);
      } else {
        // If no specific request types found, treat entire XML as first request
        setDetectedRequests([{ type: 'Request 1', xml: content }]);
        setStatus('success');
        setMessage(`Valid XML loaded${isSoap ? ' (SOAP Envelope detected)' : ''}. Mapped to a request block.`);
      }
    };

    reader.onerror = () => {
      setStatus('error');
      setMessage('Failed to read file.');
    };

    reader.readAsText(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

  const handleAutoFill = () => {
    if (detectedRequests.length === 0) return;

    const filledRequests = detectedRequests.map((d) => ({
      name: d.type,
      xml: d.xml,
      enabled: true,
    }));

    onAutoFill(filledRequests);
    navigate('/');
  };

  const handleReset = () => {
    setFile(null);
    setFileContent('');
    setStatus(null);
    setMessage('');
    setDetectedRequests([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <button className="back-link" onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="upload-header">
          <div className="upload-icon-large">
            <FileCode2 size={32} />
          </div>
          <h1 className="upload-title">Upload XML File</h1>
          <p className="upload-desc">
            Drag and drop your SOAP XML file to auto-detect and fill request blocks
          </p>
        </div>

        {/* Drop Zone */}
        <div
          className={`drop-zone ${dragOver ? 'drag-over' : ''} ${status === 'success' || status === 'warning' ? 'has-file' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!file ? handleBrowse : undefined}
        >
          {!file ? (
            <>
              <div className="drop-icon">
                <Upload size={40} strokeWidth={1.5} />
              </div>
              <p className="drop-text">Drop your SOAP XML file here</p>
              <p className="drop-subtext">or click to browse</p>
            </>
          ) : (
            <div className="file-info">
              <FileUp size={24} className="file-icon" />
              <div className="file-details">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleReset(); }}>
                Remove
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xml"
          className="hidden-input"
          onChange={handleFileChange}
        />

        {!file && (
          <div className="browse-section">
            <span className="or-divider">OR</span>
            <button className="btn btn-outline" onClick={handleBrowse}>
              <FileUp size={14} />
              Browse Files
            </button>
          </div>
        )}

        <div className="supported-info">
          <span>Supported: <strong>.xml</strong></span>
          <span className="info-dot">·</span>
          <span>Max Size: <strong>10MB</strong></span>
        </div>

        {/* Status Messages */}
        {status && (
          <div className={`status-banner ${status}`}>
            {status === 'loading' && <div className="spinner" />}
            {status === 'success' && <CheckCircle2 size={16} />}
            {status === 'error' && <AlertTriangle size={16} />}
            {status === 'warning' && <AlertTriangle size={16} />}
            <span>{message}</span>
          </div>
        )}

        {/* Detected Requests Preview */}
        {detectedRequests.length > 0 && (status === 'success' || status === 'warning') && (
          <div className="detected-section">
            <h3 className="detected-title">Detected Request Types</h3>
            <div className="detected-list">
              {detectedRequests.map((req, i) => (
                <div key={i} className="detected-item">
                  <span className="detected-num">{i + 1}</span>
                  <span className="detected-name">{req.type}</span>
                  <span className="detected-size">{(req.xml.length / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload & Auto Parse Button */}
        {(status === 'success' || status === 'warning') && (
          <button className="btn btn-primary btn-lg upload-action-btn" onClick={handleAutoFill}>
            <Upload size={16} />
            Upload & Auto Parse
          </button>
        )}
      </div>
    </div>
  );
}
