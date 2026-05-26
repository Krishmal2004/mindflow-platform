import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import AdminDashboard from '@/pages/AdminDashboard';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white px-6 text-center">
      <div className="text-7xl font-extrabold text-neutral-200 mb-4">404</div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Page not found</h1>
      <p className="text-neutral-500 mb-8">The page you're looking for doesn't exist.</p>
      <a href="/admin" className="px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors">
        Go to Dashboard
      </a>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </ErrorBoundary>
  )
}

export default App
