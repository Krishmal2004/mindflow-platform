import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { DashboardIcon, TablesIcon, ReportsIcon, LogoutIcon, CollapseIcon } from './Icons';
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
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="logo">
            <h2>MindFlow Admin</h2>
          </div>
        )}
        <button 
          className="toggle-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <CollapseIcon collapsed={isCollapsed} />
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            return (
              <li 
                key={item.id} 
                className={active ? 'active' : ''}
                onClick={() => handleNavigation(item.path)}
              >
                <IconComponent active={active} />
                {!isCollapsed && <span className="label">{item.label}</span>}
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        {!isCollapsed && user && (
          <div className="user-info">
            <div className="username">{user.email}</div>
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          <LogoutIcon />
          {!isCollapsed && <span className="label">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;