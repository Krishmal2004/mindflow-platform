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
        { title: 'Daily Sliders', subtitle: 'Track your daily mood', icon: Sun, status: status?.dailyDone ? 'completed' : 'active', route: '/dashboard/daily' },
        { title: 'Weekly Whispers', subtitle: 'Reflect on your week', icon: Calendar, status: status?.weeklyDone ? 'completed' : 'active', route: '/dashboard/weekly' },
        { title: 'Thrive Tracker', subtitle: 'Monitor your growth', icon: TrendingUp, status: status?.monthlyDone ? 'completed' : 'active', route: '/dashboard/questionnaire' },
        { title: 'Stress Snapshot', subtitle: 'Capture stress levels', icon: Camera, status: 'locked' },
        { title: 'Mindful Mirror', subtitle: 'Self-reflection', icon: User, status: 'locked' },
    ];

    const handleStepClick = (step: Step) => {
        if (step.status !== 'locked' && step.route) navigate(step.route);
    };

    return (
        <div className="relative border-l-2 border-neutral-200 ml-6 space-y-8 py-4">
            {STEPS.map((step, index) => (
                <div key={index} className="relative pl-8">
                    <div className={cn(
                        "absolute -left-[13px] top-1 h-6 w-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-[10px] font-bold transition-colors",
                        step.status === 'completed' ? "bg-neutral-900 text-white" :
                            step.status === 'active' ? "bg-neutral-600 text-white" : "bg-neutral-200 text-neutral-400"
                    )}>
                        {step.status === 'completed' ? '✓' : index + 1}
                    </div>
                    <div onClick={() => handleStepClick(step)} className={cn(
                        "group flex items-center p-4 rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md cursor-pointer",
                        step.status === 'locked' && "opacity-50 cursor-not-allowed bg-neutral-50"
                    )}>
                        <div className={cn(
                            "h-12 w-12 rounded-lg flex items-center justify-center mr-4 transition-colors",
                            step.status === 'completed' ? "bg-neutral-100 text-neutral-900" :
                                step.status === 'locked' ? "bg-neutral-100 text-neutral-300" : "bg-neutral-100 text-neutral-600"
                        )}>
                            <step.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className={cn("font-semibold text-neutral-900", step.status === 'locked' && "text-neutral-400")}>{step.title}</h3>
                            <p className="text-sm text-neutral-500">{step.subtitle}</p>
                            {step.status === 'active' && <span className="text-xs text-neutral-900 font-medium mt-1 block">Start Now →</span>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
