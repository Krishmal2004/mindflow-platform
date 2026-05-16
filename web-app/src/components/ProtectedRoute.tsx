import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;

                if (!session) {
                    navigate('/login', { replace: true });
                    return;
                }
                setAuthenticated(true);
            } catch {
                if (mounted) navigate('/login', { replace: true });
            } finally {
                if (mounted) setChecking(false);
            }
        };

        checkAuth();

        // Listen for auth state changes (token expiry, sign out)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session && mounted) {
                navigate('/login', { replace: true });
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [navigate]);

    if (checking) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return authenticated ? <>{children}</> : null;
}
