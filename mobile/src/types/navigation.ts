export type RootStackParamList = {
    Splash: undefined;
    Onboarding: undefined;
    Login: undefined;
    Signup: undefined;
    OtpVerification: { email: string };
    MainTabs: undefined;
    Dashboard: undefined;
    DailySliders: undefined;
    WeeklyWhispers: undefined;
    ThriveTracker: undefined;
    StressSnapshot: undefined;
    MindfulMirror: undefined;
    BreathingInhaler: undefined;
    YogaRoute: undefined;
    CompleteTask: {
        title: string;
        message: string;
        buttonText?: string;
        historyData?: any[];
    };
};
