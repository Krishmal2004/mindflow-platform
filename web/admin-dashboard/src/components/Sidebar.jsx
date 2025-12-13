// Updated Sidebar.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { DashboardIcon, TablesIcon, ReportsIcon, LogoutIcon, CollapseIcon } from './Icons'; // Assuming Icons.jsx is in the same folder
import '../assets/css/Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/' },
    { id: 'tables', label: 'Tables', icon: TablesIcon, path: '/tables' },
    { id: 'reports', label: 'Reports', icon: ReportsIcon, path: '/reports' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} aria-label="Sidebar Navigation">
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="logo">
            <h2>MindFlow Admin</h2>
          </div>
        )}
        <button
          className="toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <CollapseIcon collapsed={isCollapsed} />
        </button>
      </div>
      <nav className="sidebar-nav" aria-label="Main Menu">
        <ul>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            return (
              <li
                key={item.id}
                className={active ? 'active' : ''}
                onClick={() => handleNavigation(item.path)}
                role="button"
                tabIndex={0}
                aria-label={item.label}
              >
                <IconComponent active={active} />
                {!isCollapsed && <span className="label">{item.label}</span>}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="sidebar-footer">
        {/* {!isCollapsed && user && (
          <div className="user-info">
            <div className="username">{user.email}</div>
          </div>
        )} */}
        <button className="logout-btn" onClick={handleLogout} aria-label="Logout">
          <LogoutIcon />
          {!isCollapsed && <span className="label">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;