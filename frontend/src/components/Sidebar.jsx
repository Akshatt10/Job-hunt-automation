import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-header">
        <div className="sidebar-logo">⚡</div>
        <span className="sidebar-brand">ColdReach</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="nav-icon">📊</span>
          Dashboard
        </NavLink>

        <NavLink
          to="/contacts"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="nav-icon">👥</span>
          Contacts
        </NavLink>

        <NavLink
          to="/campaigns"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="nav-icon">🚀</span>
          Outreach
        </NavLink>

        <div className="sidebar-section">Settings</div>

        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="nav-icon">👤</span>
          Profile & Resume
        </NavLink>

        <NavLink
          to="/smtp-settings"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="nav-icon">📧</span>
          Email Setup
        </NavLink>

        <NavLink
          to="/billing"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="nav-icon">💳</span>
          Billing
        </NavLink>
      </nav>

      {/* Footer — user info */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-email-text">{user?.email || ''}</div>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm w-full mt-md"
          onClick={handleLogout}
          style={{ justifyContent: 'flex-start', paddingLeft: '16px' }}
        >
          🚪 Sign out
        </button>
      </div>
    </aside>
  );
}
