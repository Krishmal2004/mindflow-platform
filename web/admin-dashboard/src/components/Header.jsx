import { useState, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
// Import SidebarContext if created: import { useSidebar } from '../contexts/SidebarContext';
import '../assets/css/Header.css';

const Header = () => {
  const { user } = useSession();
  // Placeholder for collapsed state; replace with actual context/logic
  // const { isCollapsed } = useSidebar(); // Assuming SidebarContext provides this
  const [isCollapsed] = useState(false); // Temp placeholder—update dynamically

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getInitial = (name) => {
    return name ? name[0].toUpperCase() : '';
  };

  return (
    <header className={`admin-header ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="header-content">
        <div className="user-info">
          {user && (
            <>
              <div className="user-avatar">{getInitial(user.username)}</div>
              <div className="user-details">
                <span className="username">{user.username}</span>
                <span className="user-role">Admin</span> {/* Or {user.role} if available */}
              </div>
            </>
          )}
        </div>
        <div className="clock">
          <div className="time">{formatTime(currentTime)}</div>
          <div className="date">{formatDate(currentTime)}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;