import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', path: '/', icon: 'bi-speedometer2' },
  { label: 'Servers', path: '/servers', icon: 'bi-hdd-rack' },
  { label: 'Sites', path: '/sites', icon: 'bi-file-text' },
  { label: 'Config', path: '/config', icon: 'bi-gear' },
  { label: 'Logs', path: '/logs', icon: 'bi-terminal' },
  { label: 'Audit', path: '/audit', icon: 'bi-clock-history' },
];

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

export function Layout({ children, onLogout }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Mobile offcanvas sidebar */}
      <div className={`offcanvas offcanvas-start d-md-none ${mobileOpen ? 'show' : ''}`} tabIndex={-1} style={{ width: 240 }}>
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Caddy Manager</h5>
          <button type="button" className="btn-close" onClick={() => setMobileOpen(false)} />
        </div>
        <div className="offcanvas-body p-0">
          <ul className="list-group list-group-flush">
            {navItems.map((item) => (
              <li
                key={item.path}
                className={`list-group-item list-group-item-action ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                style={{ cursor: 'pointer' }}
              >
                <i className={`bi ${item.icon} me-2`}></i>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {mobileOpen && <div className="offcanvas-backdrop fade show" onClick={() => setMobileOpen(false)} />}

      {/* Desktop sidebar */}
      <div className="d-none d-md-flex flex-column bg-dark text-white" style={{ width: 240, minHeight: '100vh' }}>
        <div className="p-3 fs-5 fw-bold">Caddy Manager</div>
        <ul className="nav flex-column">
          {navItems.map((item) => (
            <li className="nav-item" key={item.path}>
              <a
                className={`nav-link ${location.pathname === item.path ? 'active text-white bg-primary' : 'text-secondary'}`}
                href="#"
                onClick={(e) => { e.preventDefault(); navigate(item.path); }}
              >
                <i className={`bi ${item.icon} me-2`}></i>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Main content area */}
      <div className="d-flex flex-column flex-grow-1">
        {/* Top navbar */}
        <nav className="navbar navbar-dark bg-primary d-md-none">
          <div className="container-fluid">
            <button className="navbar-toggler" type="button" onClick={() => setMobileOpen(true)}>
              <span className="navbar-toggler-icon"></span>
            </button>
            <span className="navbar-brand">Caddy Manager</span>
            {onLogout && (
              <button className="btn btn-sm btn-outline-light" onClick={onLogout}>
                <i className="bi bi-box-arrow-right"></i>
              </button>
            )}
          </div>
        </nav>
        {/* Desktop top bar */}
        <div className="d-none d-md-flex justify-content-end p-2">
          {onLogout && (
            <button className="btn btn-sm btn-outline-secondary" onClick={onLogout}>
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          )}
        </div>
        <div className="p-3 flex-grow-1">
          {children}
        </div>
      </div>
    </div>
  );
}
