import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import Sidebar from './Sidebar';
import Header from './Header';
import '../assets/css/DashboardLayout.css';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Function to toggle sidebar collapse
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (loading) {
    return (
      <div className="dashboard-layout-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <Header />
      <main className={`dashboard-main ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;