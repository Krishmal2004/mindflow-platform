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
            const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError || !user) throw authError;

            // Check strict 'admins' table — only admins allowed
            const { data: admin } = await supabase
                .from('admins')
                .select('id')
                .eq('id', user.id)
                .single();

            if (!admin) {
                await supabase.auth.signOut();
                throw new Error('Access denied. This portal is for administrators only.');
            }

            navigate('/admin');

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
            <div className="hidden lg:block relative h-full bg-neutral-900">
                <div className="absolute inset-0 bg-black/30 z-10" />
                <img
                    src={authImage}
                    alt="Authentication Background"
                    className="h-full w-full object-cover opacity-80 grayscale transition-transform duration-1000 hover:scale-105"
                />
                <div className="absolute bottom-10 left-10 z-20 text-white max-w-md">
                    <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">Admin Portal</h2>
                    <p className="text-lg text-neutral-300 drop-shadow-md">
                        Manage participants and monitor research progress.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white h-full">
                <div className="mx-auto grid w-full max-w-[400px] gap-8">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="relative w-24 h-24 mb-2">
                            <img
                                src={appLogo}
                                alt="MindFlow Logo"
                                className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                            Admin Sign In
                        </h1>
                        <p className="text-neutral-500">
                            Enter your administrator credentials
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@mindflow.app"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11 px-4 bg-white border-neutral-200 focus:border-neutral-400 focus:ring-neutral-400 transition-all"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11 px-4 bg-white border-neutral-200 focus:border-neutral-400 focus:ring-neutral-400 transition-all"
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center animate-in fade-in slide-in-from-top-1">
                                <span className="mr-2">⚠️</span> {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="text-center text-sm text-neutral-400 mt-4">
                        <p>
                            Secure Admin Portal &copy; {new Date().getFullYear()} MindFlow.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
