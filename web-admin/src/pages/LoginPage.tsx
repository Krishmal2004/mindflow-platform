import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import appLogo from '../assets/app-icon.png';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ email, password });
            if (authError || !user) throw authError ?? new Error('Authentication failed');

            // Verify admin table membership
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
            setError(err.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
            {/* Subtle dot grid background */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0"
                style={{
                    backgroundImage: 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    opacity: 0.4,
                }}
            />

            <div className="relative z-10 w-full max-w-[420px]">
                {/* Card */}
                <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">

                    {/* Top accent stripe */}
                    <div className="h-1 w-full bg-gradient-to-r from-neutral-900 via-neutral-600 to-neutral-400" />

                    <div className="px-8 py-10">
                        {/* Logo & heading */}
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="h-14 w-14 bg-neutral-900 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                                <img src={appLogo} alt="MindFlow" className="h-9 w-9 object-contain" />
                            </div>
                            <h1 className="text-xl font-bold text-neutral-950 tracking-tight">Admin Portal</h1>
                            <p className="text-xs text-neutral-400 mt-1">Restricted access — authorised administrators only</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-semibold text-neutral-700">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@mindflow.app"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-10 text-sm bg-neutral-50 border-neutral-200 focus:border-neutral-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-xs font-semibold text-neutral-700">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-10 text-sm pr-10 bg-neutral-50 border-neutral-200 focus:border-neutral-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword
                                            ? <EyeOff className="h-4 w-4" />
                                            : <Eye className="h-4 w-4" />
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Error state */}
                            {error && (
                                <div className="flex items-start gap-2.5 p-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg">
                                    <span className="mt-0.5 shrink-0">⚠</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-10 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-all"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Authenticating…' : 'Sign In'}
                            </Button>
                        </form>
                    </div>

                    {/* Footer strip */}
                    <div className="border-t border-neutral-100 bg-neutral-50 px-8 py-4 flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                        <p className="text-[11px] text-neutral-400">
                            Secured with Supabase Auth · TLS encrypted · Session-only access
                        </p>
                    </div>
                </div>

                <p className="text-center text-[11px] text-neutral-400 mt-5">
                    © {new Date().getFullYear()} MindFlow Research. All rights reserved.
                </p>
            </div>
        </div>
    );
}
