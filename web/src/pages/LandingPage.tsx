import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import AuthLogo from "@/assets/Auth.png"

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden">

            {/* Left Side - Image (Hidden on mobile, 50% on desktop) */}
            <div className="hidden md:block w-1/2 relative bg-teal-900">
                <img
                    src="/hero.png"
                    alt="Mindfulness Split Screen"
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-teal-900/40 to-transparent mix-blend-multiply"></div>
                <div className="absolute bottom-12 left-12 text-white p-6 max-w-lg">
                    <h2 className="text-3xl font-bold mb-4">"The present moment is filled with joy and happiness. If you are attentive, you will see it."</h2>
                    <p className="text-teal-100/80">— Thich Nhat Hanh</p>
                </div>
            </div>

            {/* Right Side - Content */}
            <div className="w-full md:w-1/2 flex flex-col">
                {/* Header */}
                <header className="w-full py-6 px-8 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <img src={AuthLogo} alt="MindFlow Logo" className="h-8 w-8" />
                        <span className="text-xl font-bold text-slate-900 tracking-tight">MindFlow</span>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/login')} className="border-teal-200 text-teal-700 hover:bg-teal-50">
                        Sign In
                    </Button>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex flex-col items-center justify-center p-8 text-center md:text-left md:items-start max-w-xl mx-auto md:mx-0 md:ml-20">
                    <div className="inline-block px-3 py-1 mb-6 text-sm font-medium text-teal-800 bg-teal-100 rounded-full">
                        Research Initiative 2026
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tighter mb-6 leading-[1.1]">
                        Mindfulness <br />
                        <span className="text-teal-600">Reimagined.</span>
                    </h1>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed text-balance">
                        Join our comprehensive research study designed to understand the impact of daily mindfulness on mental well-being.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white min-w-[200px]" onClick={() => navigate('/login')}>
                            Start Your Journey
                        </Button>
                        <Button size="lg" variant="ghost" className="text-slate-600">
                            Learn More
                        </Button>
                    </div>

                    <div className="mt-16 grid grid-cols-2 gap-8 text-left">
                        <div>
                            <h3 className="font-bold text-2xl text-slate-900">2.4k+</h3>
                            <p className="text-sm text-slate-500 mt-1">Active Participants</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-2xl text-slate-900">100%</h3>
                            <p className="text-sm text-slate-500 mt-1">Secure & Private</p>
                        </div>
                    </div>
                </main>
            </div>

        </div>
    )
}
