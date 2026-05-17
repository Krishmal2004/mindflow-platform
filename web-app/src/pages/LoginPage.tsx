import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft } from "lucide-react"
import appLogo from '../assets/app-icon.png';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError || !user) throw authError;
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Please enter your email first.');
            return;
        }
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            setError(null);
            alert('Password reset link sent to your email.');
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email.');
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col" style={{ paddingTop: 'var(--sat, 0px)', paddingBottom: 'var(--sab, 0px)' }}>
            {/* Back button */}
            <div className="px-4 pt-3">
                <button onClick={() => navigate('/')} className="p-2 text-neutral-400 active:text-neutral-700 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </button>
            </div>

            {/* Login form */}
            <div className="flex-1 flex items-center justify-center px-6">
                <div className="w-full max-w-sm space-y-8">
                    {/* Logo & heading */}
                    <div className="flex flex-col items-center space-y-3 text-center">
                        <img
                            src={appLogo}
                            alt="MindFlow Logo"
                            className="w-20 h-20 object-contain"
                        />
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                            Welcome Back
                        </h1>
                        <p className="text-sm text-neutral-500">
                            Sign in to continue your journey
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-neutral-700">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 px-4 bg-neutral-50 border-neutral-200 rounded-xl text-base focus:border-neutral-400 focus:ring-neutral-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium text-neutral-700">Password</Label>
                                <button
                                    type="button"
                                    className="text-xs text-neutral-400 active:text-neutral-700 transition-colors"
                                    onClick={handleForgotPassword}
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 px-4 bg-neutral-50 border-neutral-200 rounded-xl text-base focus:border-neutral-400 focus:ring-neutral-400"
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 flex items-center">
                                <span className="mr-2">!</span> {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 text-white font-semibold rounded-xl text-base shadow-lg"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="text-center text-xs text-neutral-300 pt-4">
                        &copy; {new Date().getFullYear()} MindFlow Research
                    </div>
                </div>
            </div>
        </div>
    );
}
