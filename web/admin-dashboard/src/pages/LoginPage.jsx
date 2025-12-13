// Updated LoginPage.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import MindfulnessIcon from '../components/MindfulnessIcon';
import '../assets/css/LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useSession();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await login(email, password);
      if (response.success) {
        navigate('/');
      } else {
        setError(response.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <MindfulnessIcon />
          </div>
          <h1 className="login-title">MindFlow Admin Portal</h1>
          <p className="login-subtitle">Sign in to cultivate mindful insights</p>
        </div>
        {/* Show session timeout message if present */}
        {location.state?.message && (
          <div className="info-message">{location.state.message}</div>
        )}
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              aria-required="true"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              aria-required="true"
            />
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner-small"></span>
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>
        <div className="login-footer">
          <p>© 2025 MindFlow Research. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;