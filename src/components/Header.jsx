import { Link, useLocation } from 'react-router-dom';
import { FileCode2, Upload, Settings, User } from 'lucide-react';
import './Header.css';

export default function Header() {
  const location = useLocation();

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
            <Upload size={16} />
            Upload
          </Link>
        </nav>

        <div className="header-actions">
          <button className="icon-btn" title="Settings">
            <Settings size={18} />
          </button>
          <button className="icon-btn profile-btn" title="Profile">
            <User size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
