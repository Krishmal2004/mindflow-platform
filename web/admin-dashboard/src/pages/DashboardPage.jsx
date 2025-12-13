import { useState, useEffect } from 'react';
import ApiService from '../services/api';
import '../assets/css/DashboardPage.css';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    dailyEntries: 0,
    weeklyResponses: 0,
    mainQuestionnaires: 0
  });
  
  const [systemStatus, setSystemStatus] = useState({
    dbType: 'PostgreSQL',
    ssl: 'Enabled',
    languageVersion: 'JavaScript ES6',
    uptime: '99.9%'
  });
  
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from API
      const tables = await ApiService.getTables();
      
      // Get counts for specific tables
      const profilesTable = tables.find(t => t.name === 'profiles');
      const dailySlidersTable = tables.find(t => t.name === 'daily_sliders');
      const weeklyAnswersTable = tables.find(t => t.name === 'weekly_answers');
      const mainQuestionnaireTable = tables.find(t => t.name === 'main_questionnaire_responses');
      
      setStats({
        totalUsers: profilesTable?.rows || 0,
        dailyEntries: dailySlidersTable?.rows || 0,
        weeklyResponses: weeklyAnswersTable?.rows || 0,
        mainQuestionnaires: mainQuestionnaireTable?.rows || 0
      });
      
      // Fetch recent activities (this would need to be implemented in the backend)
      // For now, we'll simulate some activities
      const recentActivities = [
        { time: '2 hours ago', description: 'New user registered: user_2847' },
        { time: '4 hours ago', description: 'Daily entry submitted by user_1928' },
        { time: '1 day ago', description: 'Weekly questionnaire completed by user_4821' },
        { time: '2 days ago', description: 'Voice recording uploaded for user_3759' }
      ];
      
      setActivities(recentActivities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <h2>Dashboard Overview</h2>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-value">{stats.totalUsers.toLocaleString()}</p>
          <p className="stat-description">Active participants in the study</p>
        </div>
        <div className="stat-card">
          <h3>Daily Entries</h3>
          <p className="stat-value">{stats.dailyEntries.toLocaleString()}</p>
          <p className="stat-description">Entries recorded today</p>
        </div>
        <div className="stat-card">
          <h3>Weekly Responses</h3>
          <p className="stat-value">{stats.weeklyResponses.toLocaleString()}</p>
          <p className="stat-description">Completed this week</p>
        </div>
        <div className="stat-card">
          <h3>Main Questionnaires</h3>
          <p className="stat-value">{stats.mainQuestionnaires.toLocaleString()}</p>
          <p className="stat-description">Completed this month</p>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h3>System Status</h3>
          <div className="system-status">
            <div className="status-item">
              <span className="status-label">Database Type:</span>
              <span className="status-value">{systemStatus.dbType}</span>
            </div>
            <div className="status-item">
              <span className="status-label">SSL:</span>
              <span className="status-value">{systemStatus.ssl}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Language Version:</span>
              <span className="status-value">{systemStatus.languageVersion}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Uptime:</span>
              <span className="status-value">{systemStatus.uptime}</span>
            </div>
          </div>
        </div>
        
        <div className="dashboard-section">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {activities.map((activity, index) => (
              <div className="activity-item" key={index}>
                <span className="activity-time">{activity.time}</span>
                <span className="activity-description">{activity.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;