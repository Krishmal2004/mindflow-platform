import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import AuthLogo from "@/assets/Auth.png"

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col" style={{ paddingTop: 'var(--sat, 0px)', paddingBottom: 'var(--sab, 0px)' }}>
            {/* Header */}
            <header className="w-full py-4 px-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src={AuthLogo} alt="MindFlow Logo" className="h-7 w-7" />
                    <span className="text-lg font-bold text-neutral-900 tracking-tight">MindFlow</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/login')} className="border-neutral-300 text-neutral-700 text-xs h-8 px-3">
                    Sign In
                </Button>
            </header>

            {/* Hero */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="inline-block px-3 py-1 mb-5 text-xs font-medium text-neutral-500 bg-neutral-100 rounded-full">
                    Research Initiative 2026
                </div>

                <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 tracking-tighter mb-4 leading-[1.1]">
                    Your Mindful <br />
                    <span className="text-neutral-400">Journey.</span>
                </h1>

                <p className="text-base text-neutral-500 mb-8 leading-relaxed max-w-sm">
                    Track your daily well-being, complete guided exercises, and contribute to mindfulness research.
                </p>

                <Button
                    size="lg"
                    className="bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 text-white w-full max-w-xs h-12 text-base font-semibold rounded-xl shadow-lg"
                    onClick={() => navigate('/login')}
                >
                    Get Started
                </Button>

                <div className="mt-14 grid grid-cols-2 gap-8 text-center">
                    <div>
                        <h3 className="font-bold text-xl text-neutral-900">Daily</h3>
                        <p className="text-xs text-neutral-400 mt-1">Mood & Sleep Tracking</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-neutral-900">Weekly</h3>
                        <p className="text-xs text-neutral-400 mt-1">Voice Reflections</p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 text-center text-xs text-neutral-300">
                &copy; {new Date().getFullYear()} MindFlow Research
            </footer>
        </div>
    )
}
