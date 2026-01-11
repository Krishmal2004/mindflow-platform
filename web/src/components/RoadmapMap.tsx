import { useNavigate } from 'react-router-dom';
import { type LucideIcon, Sun, Calendar, TrendingUp, Camera, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoadmapMapProps {
    status?: {
        dailyDone: boolean;
        weeklyDone: boolean;
        monthlyDone: boolean;
    };
}

interface Step {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    status: 'locked' | 'active' | 'completed';
    route?: string;
}

export function RoadmapMap({ status }: RoadmapMapProps) {
    const navigate = useNavigate();

    const STEPS: Step[] = [
        {
            title: 'Daily Sliders',
            subtitle: 'Track your daily mood',
            icon: Sun,
            status: status?.dailyDone ? 'completed' : 'active',
            route: '/dashboard/daily'
        },
        {
            title: 'Weekly Whispers',
            subtitle: 'Reflect on your week',
            icon: Calendar,
            status: status?.weeklyDone ? 'completed' : 'active', // Should unlock if daily is done? For now active.
            route: '/dashboard/weekly'
        },
        {
            title: 'Thrive Tracker',
            subtitle: 'Monitor your growth',
            icon: TrendingUp,
            status: status?.monthlyDone ? 'completed' : 'active', // Main Questionnaire
            route: '/dashboard/questionnaire'
        },
        {
            title: 'Stress Snapshot',
            subtitle: 'Capture stress levels',
            icon: Camera,
            status: 'locked'
        },
        {
            title: 'Mindful Mirror',
            subtitle: 'Self-reflection',
            icon: User,
            status: 'locked'
        },
    ];

    const handleStepClick = (step: Step) => {
        if (step.status !== 'locked' && step.route) {
            navigate(step.route);
        }
    };

    return (
        <div className="relative border-l-2 border-slate-200 ml-6 space-y-8 py-4">
            {STEPS.map((step, index) => (
                <div key={index} className="relative pl-8">
                    {/* Dot */}
                    <div className={cn(
                        "absolute -left-[13px] top-1 h-6 w-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-[10px] font-bold transition-colors",
                        step.status === 'completed' ? "bg-green-500 text-white" :
                            step.status === 'active' ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500"
                    )}>
                        {step.status === 'completed' ? '✓' : index + 1}
                    </div>

                    {/* Card */}
                    <div
                        onClick={() => handleStepClick(step)}
                        className={cn(
                            "group flex items-center p-4 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md cursor-pointer",
                            step.status === 'locked' && "opacity-60 cursor-not-allowed bg-slate-50"
                        )}>
                        <div className={cn(
                            "h-12 w-12 rounded-lg flex items-center justify-center mr-4 transition-colors",
                            step.status === 'completed' ? "bg-green-50 text-green-600" :
                                step.status === 'locked' ? "bg-slate-100 text-slate-400" : "bg-teal-50 text-teal-600"
                        )}>
                            <step.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className={cn("font-semibold text-slate-900", step.status === 'locked' && "text-slate-500")}>
                                {step.title}
                            </h3>
                            <p className="text-sm text-slate-500">{step.subtitle}</p>
                            {step.status === 'active' && (
                                <span className="text-xs text-teal-600 font-medium mt-1 block">Start Now →</span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
