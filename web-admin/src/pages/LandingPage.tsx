import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import appLogo from '../assets/app-icon.png';
import { Shield, BarChart2, Brain, Users, ChevronRight } from 'lucide-react';

const features = [
    {
        icon: Brain,
        title: 'Evidence-Based',
        desc: 'Grounded in validated psychological instruments: PSS-10, WEMWBS-14 & FFMQ-15.',
    },
    {
        icon: BarChart2,
        title: 'Real-Time Analytics',
        desc: 'Monitor participant engagement, mood trends, and weekly voice journals as they happen.',
    },
    {
        icon: Shield,
        title: 'Secure by Design',
        desc: 'All data is encrypted at rest and in transit. Supabase RLS policies enforce strict access control.',
    },
    {
        icon: Users,
        title: 'Multi-Cohort Ready',
        desc: 'Supports experimental and control groups. Research IDs tie seamlessly to anonymised profiles.',
    },
];

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col">

            {/* ── Header ── */}
            <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white/90 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <img src={appLogo} alt="MindFlow" className="h-8 w-8 rounded-lg" />
                        <span className="text-base font-bold tracking-tight text-neutral-900">MindFlow</span>
                        <span className="ml-1 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 border border-neutral-300 rounded text-neutral-500">
                            Research
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/login')}
                        className="border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-medium text-xs h-8 px-4 rounded"
                    >
                        Admin Sign In
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                </div>
            </header>

            {/* ── Hero ── */}
            <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center relative overflow-hidden">
                {/* Subtle grid background */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #e5e5e5 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                        opacity: 0.45,
                    }}
                />
                {/* Soft radial glow */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(255,255,255,0.95) 40%, transparent 100%)',
                    }}
                />

                <div className="relative z-10 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs font-semibold tracking-wider uppercase text-neutral-500 bg-neutral-100 border border-neutral-200 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 inline-block" />
                        University Research Platform · 2026
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-neutral-950 tracking-tighter leading-[1.05] mb-6">
                        Mindfulness<br />
                        <span className="text-neutral-400">Research, Quantified.</span>
                    </h1>

                    <p className="text-lg text-neutral-500 max-w-xl mx-auto mb-10 leading-relaxed">
                        A secure, administrator-only portal for monitoring participant data, managing cohorts,
                        and exporting validated research metrics.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button
                            size="lg"
                            className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-8 h-11 rounded shadow-md"
                            onClick={() => navigate('/login')}
                        >
                            Access Admin Portal
                            <ChevronRight className="h-4 w-4 ml-1.5" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* ── Feature Grid ── */}
            <section className="border-t border-neutral-100 bg-neutral-50 px-6 py-20">
                <div className="max-w-5xl mx-auto">
                    <p className="text-center text-xs font-bold uppercase tracking-widest text-neutral-400 mb-12">
                        Built for Researchers
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="group">
                                <div className="h-10 w-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center mb-4 shadow-xs group-hover:border-neutral-400 transition-colors">
                                    <Icon className="h-5 w-5 text-neutral-600" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-sm font-bold text-neutral-900 mb-1.5">{title}</h3>
                                <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-neutral-100 px-6 py-6">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <img src={appLogo} alt="MindFlow" className="h-5 w-5 rounded" />
                        <span className="text-xs font-medium text-neutral-500">MindFlow Research</span>
                    </div>
                    <p className="text-xs text-neutral-400">
                        © {new Date().getFullYear()} MindFlow. All rights reserved.
                        This portal is restricted to authorised administrators only.
                    </p>
                </div>
            </footer>
        </div>
    );
}
