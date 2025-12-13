import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if there's a stored token
        const token = localStorage.getItem('adminToken');
        if (token) {
          // Validate token with Supabase
          const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
          
          if (error) {
            throw error;
          }
          
          if (supabaseUser) {
            setUser(supabaseUser);
            setLastActivity(Date.now());
          }
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        setError(err.message);
        localStorage.removeItem('adminToken');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Update last activity on user interactions
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => updateActivity();

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [updateActivity]);

  // Check for session timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActivity;
      
      // 5 minutes in milliseconds
      if (inactiveTime > 5 * 60 * 1000) {
        logout();
        navigate('/login', { 
          state: { 
            message: 'Your session has ended for your security. Please log in again to continue your work.' 
          } 
        });
      }
      // Show warning 1 minute before timeout (at 4 minutes)
      else if (inactiveTime > 4 * 60 * 1000 && inactiveTime < 4 * 60 * 1000 + 2000) {
        // Could show a warning notification here
        console.log('Session will expire in 1 minute');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActivity, navigate]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.login(email, password);
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('adminToken', response.token);
        setLastActivity(Date.now());
        return { success: true };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('adminToken');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    setLoading,
    updateActivity,
    error
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};
