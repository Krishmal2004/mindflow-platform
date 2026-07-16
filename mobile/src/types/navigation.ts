export type RootStackParamList = {
    Splash: undefined;
    Onboarding: undefined;
    Login: undefined;
    Signup: undefined;
    OtpVerification: { email: string };
    ForgotPassword: { email?: string; locked?: boolean } | undefined;
    ResetOtp: { email: string };
    MainTabs: undefined;
    Dashboard: undefined;
    DailySliders: undefined;
    WeeklyWhispers: undefined;
    ThriveTracker: undefined;
    StressSnapshot: undefined;
    MindfulMirror: undefined;
    CompleteTask: {
        title: string;
        message: string;
        buttonText?: string;
        isDaily?: boolean;
        themeColor?: string;
        themeBgGrad?: readonly string[];
    };
    AboutMe: undefined;
    AboutMeQuestionnaire: undefined;
    AboutMeView: undefined;
};
