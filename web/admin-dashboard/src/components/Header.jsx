import { useState, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import '../assets/css/Header.css';

const Header = () => {
  const { user } = useSession();
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

  return (
    <header className="admin-header">
      <div className="header-content">
        <div className="user-info">
          {user && (
            <div className="user-details">
              <span className="username">{user.email}</span>
            </div>
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