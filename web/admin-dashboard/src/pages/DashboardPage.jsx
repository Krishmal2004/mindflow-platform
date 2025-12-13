import { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { UsersIcon, EntriesIcon, ResponsesIcon, QuestionnairesIcon, CheckIcon } from '../components/Icons'; // Adjust path to Icons.jsx
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
          <div className="stat-icon"><UsersIcon /></div>
          <h3>Total Users</h3>
          <p className="stat-value">{stats.totalUsers.toLocaleString()}</p>
          <p className="stat-description">Total active participants</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><EntriesIcon /></div>
          <h3>Daily Entries</h3>
          <p className="stat-value">{stats.dailyEntries.toLocaleString()}</p>
          <p className="stat-description">Total recorded entries</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><ResponsesIcon /></div>
          <h3>Weekly Responses</h3>
          <p className="stat-value">{stats.weeklyResponses.toLocaleString()}</p>
          <p className="stat-description">Total completed responses</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><QuestionnairesIcon /></div>
          <h3>Main Questionnaires</h3>
          <p className="stat-value">{stats.mainQuestionnaires.toLocaleString()}</p>
          <p className="stat-description">Total completed questionnaires</p>
        </div>
      </div>
      <div className="dashboard-section">
        <h3>System Status</h3>
        <div className="system-status">
          <div className="status-item">
            <span className="status-label">Database Type:</span>
            <span className="status-value">{systemStatus.dbType} <CheckIcon /></span>
          </div>
          <div className="status-item">
            <span className="status-label">SSL:</span>
            <span className="status-value">{systemStatus.ssl} <CheckIcon /></span>
          </div>
          <div className="status-item">
            <span className="status-label">Language Version:</span>
            <span className="status-value">{systemStatus.languageVersion} <CheckIcon /></span>
          </div>
          <div className="status-item">
            <span className="status-label">Uptime:</span>
            <span className="status-value">{systemStatus.uptime} <CheckIcon /></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;