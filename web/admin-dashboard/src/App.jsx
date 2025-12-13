import { Routes, Route } from 'react-router-dom';
import { SessionProvider } from './contexts/SessionContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import TablesPage from './pages/TablesPage';
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tables" element={<TablesPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </SessionProvider>
  );
}

export default App;