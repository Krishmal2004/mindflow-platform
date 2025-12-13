import { useState, useEffect } from 'react';
import ApiService from '../services/api';
import '../assets/css/ReportsPage.css';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getReports();
      setReports(data);
    } catch (err) {
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleReportSelect = async (reportId) => {
    setSelectedReport(reportId);
    setLoading(true);
    setError('');
    
    try {
      const data = await ApiService.getReportData(reportId);
      setReportData(data);
    } catch (err) {
      setError('Failed to fetch report data');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-page">
      <h2>Reports & Analytics</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="reports-container">
        <div className="reports-list">
          <h3>Available Reports</h3>
          {loading && !reports.length ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading reports...</p>
            </div>
          ) : (
            <ul>
              {reports.map((report) => (
                <li 
                  key={report.id} 
                  className={selectedReport === report.id ? 'active' : ''}
                  onClick={() => handleReportSelect(report.id)}
                >
                  {report.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="report-view">
          <h3>{reportData ? reportData.title : 'Select a report'}</h3>
          {loading && selectedReport ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading report data...</p>
            </div>
          ) : reportData && !loading ? (
            <div className="report-content">
              <p className="report-description">{reportData.description}</p>
              
              <div className="report-metrics">
                {reportData.metrics.map((metric, index) => (
                  <div key={index} className="metric-card">
                    <h4>{metric.name}</h4>
                    <p className="metric-value">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedReport && !loading && !reportData ? (
            <div className="no-data-message">
              <p>No data available for this report</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;