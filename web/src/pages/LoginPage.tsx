import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import authImage from '../assets/Auth.png';
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
            // 1. Authenticate with Supabase
            const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError || !user) throw authError;

            // 2. Check strict 'admins' table
            const { data: admin } = await supabase
                .from('admins')
                .select('id')
                .eq('id', user.id)
                .single();

            // 3. Intelligent Redirect
            if (admin) {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-white">
            {/* Left Side - Hero Image */}
            <div className="hidden lg:block relative h-full bg-slate-900">
                <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-10" />
                <img
                    src={authImage}
                    alt="Authentication Background"
                    className="h-full w-full object-cover opacity-90 transition-transform duration-1000 hover:scale-105"
                />
                <div className="absolute bottom-10 left-10 z-20 text-white max-w-md">
                    <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">Mindfulness Research</h2>
                    <p className="text-lg text-slate-200 drop-shadow-md">
                        Empowering research through data-driven insights and mindful connectivity.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 lg:bg-white h-full">
                <div className="mx-auto grid w-full max-w-[400px] gap-8">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="relative w-24 h-24 mb-2">
                            <img
                                src={appLogo}
                                alt="MindFlow Logo"
                                className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Welcome Back
                        </h1>
                        <p className="text-muted-foreground text-slate-500">
                            Enter your credentials to access your dashboard
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11 px-4 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500 transition-all"
                            />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <a
                                    href="#"
                                    className="ml-auto inline-block text-sm text-teal-600 hover:text-teal-500 hover:underline transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        // TODO: Implement forgot password flow
                                        alert("Password reset functionality would go here.");
                                    }}
                                >
                                    Forgot your password?
                                </a>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11 px-4 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500 transition-all"
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100 flex items-center animate-in fade-in slide-in-from-top-1">
                                <span className="mr-2">⚠️</span> {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="text-center text-sm text-slate-500 mt-4">
                        <p>
                            Secure Admin Portal &copy; {new Date().getFullYear()} MindFlow.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
