import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthToken } from '@/lib/auth';
import { getPostAuthRoute } from '@/lib/postAuthRoute';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // Only check post-auth route when landing on /dashboard (not sub-pages)
    if (location.pathname === '/dashboard') {
      getPostAuthRoute().then(route => {
        if (route === '/about-me') {
          navigate('/about-me', { replace: true });
        } else {
          setReady(true);
        }
      });
    } else {
      setReady(true);
    }
  }, [navigate, location.pathname]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#749F82' }} />
      </div>
    );
  }

  return <>{children}</>;
}
