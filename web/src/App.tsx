import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import AdminDashboard from '@/pages/AdminDashboard';
import UserDashboard from '@/pages/UserDashboard';
import DailySliders from '@/pages/DailySliders';
import WeeklyWhispers from '@/pages/WeeklyWhispers';
import MainQuestionnaire from '@/pages/MainQuestionnaire';
import CalendarPage from '@/pages/CalendarPage';
import ProgressPage from '@/pages/ProgressPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/dashboard/daily" element={<DailySliders />} />
        <Route path="/dashboard/weekly" element={<WeeklyWhispers />} />
        <Route path="/dashboard/questionnaire" element={<MainQuestionnaire />} />
        <Route path="/dashboard/calendar" element={<CalendarPage />} />
        <Route path="/dashboard/progress" element={<ProgressPage />} />
      </Routes>
      <Toaster />
    </Router>
  )
}

export default App
