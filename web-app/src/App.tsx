import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import OtpVerificationPage from '@/pages/OtpVerificationPage';
import UserDashboard from '@/pages/UserDashboard'; // re-exports DashboardPage
import DailySlidersPage from '@/pages/DailySlidersPage';
import WeeklyWhispersPage from '@/pages/WeeklyWhispersPage';
import ThriveTrackerPage from '@/pages/ThriveTrackerPage';
import StressSnapshotPage from '@/pages/StressSnapshotPage';
import MindfulMirrorPage from '@/pages/MindfulMirrorPage';
import CompleteTaskPage from '@/pages/CompleteTaskPage';
import JourneyPage from '@/pages/JourneyPage';
import CalendarPage from '@/pages/CalendarPage';
import ProfilePage from '@/pages/ProfilePage';
import AboutMePage from '@/pages/AboutMePage';

// Shell wraps protected pages that show the bottom tab bar
function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingBottom: 64 }}>
      {children}
      <BottomNav />
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <h1 style={{ fontSize: 64, fontWeight: 800, color: '#DFE6E9', marginBottom: 16 }}>404</h1>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#2D3436', marginBottom: 8 }}>Page not found</h2>
      <p style={{ color: '#636E72', marginBottom: 32 }}>The page you're looking for doesn't exist.</p>
      <a href="/dashboard" style={{ color: '#749F82', fontWeight: 600, fontSize: 16 }}>Go to Dashboard</a>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-otp" element={<OtpVerificationPage />} />

          {/* Protected routes with BottomNav */}
          <Route path="/dashboard" element={<ProtectedRoute><AppShell><UserDashboard /></AppShell></ProtectedRoute>} />
          <Route path="/journey" element={<ProtectedRoute><AppShell><JourneyPage /></AppShell></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><AppShell><CalendarPage /></AppShell></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AppShell><ProfilePage /></AppShell></ProtectedRoute>} />

          {/* Protected routes without BottomNav (full-screen flows) */}
          <Route path="/dashboard/daily" element={<ProtectedRoute><DailySlidersPage /></ProtectedRoute>} />
          <Route path="/dashboard/weekly" element={<ProtectedRoute><WeeklyWhispersPage /></ProtectedRoute>} />
          <Route path="/dashboard/thrive" element={<ProtectedRoute><ThriveTrackerPage /></ProtectedRoute>} />
          <Route path="/dashboard/stress" element={<ProtectedRoute><StressSnapshotPage /></ProtectedRoute>} />
          <Route path="/dashboard/mirror" element={<ProtectedRoute><MindfulMirrorPage /></ProtectedRoute>} />
          <Route path="/complete" element={<ProtectedRoute><CompleteTaskPage /></ProtectedRoute>} />
          <Route path="/about-me" element={<ProtectedRoute><AboutMePage /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
