import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "MindFlow",
    slug: "app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/app-intro.png",
    scheme: "app",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
        supportsTablet: true,
        infoPlist: {
            NSMicrophoneUsageDescription: "This app needs access to the microphone to capture vocal biomarkers for mindfulness research analysis.",
        },
    },
    android: {
        adaptiveIcon: {
            backgroundColor: "#F8FDFC",
            foregroundImage: "./assets/images/app-intro.png"
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        package: "com.anonymous.app",
        permissions: [
            "android.permission.AUDIO_CAPTURE",
            "android.permission.RECORD_AUDIO",
            "android.permission.MODIFY_AUDIO_SETTINGS"
        ]
    },
    web: {
        output: "static",
        favicon: "./assets/images/favicon.png"
    },
    plugins: [
        [
            "expo-router",
            {
                "root": "./app"
            }
        ],
        [
            "expo-splash-screen",
            {
                "image": "./assets/images/app-intro.png",
                "imageWidth": 200,
                "resizeMode": "contain",
                "backgroundColor": "#F8FDFC",
                "dark": {
                    "backgroundColor": "#1a1a1a"
                }
            }
        ],
        "expo-secure-store",
        "expo-web-browser",
        "expo-asset"
    ],
    experiments: {
        typedRoutes: true,
        reactCompiler: false
    },
    extra: {
        router: {
            "root": "./app"
        },
        eas: {
            projectId: "28c868f4-8a05-43ac-8c54-6d9373417c59"
        },
        // Expose env variables to the client
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    }
});
