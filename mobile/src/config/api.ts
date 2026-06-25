import { Platform } from 'react-native';

// Android Emulator uses 10.0.2.2 to access host's localhost
// iOS Simulator and real devices need the local network IP
const LOCALHOST = Platform.select({
    android: '10.0.2.2',
    ios: 'localhost',
    default: 'localhost',
});

export const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${LOCALHOST}:3000`;

export const AUTH_ENDPOINTS = {
    SIGNUP: `${API_URL}/api/auth/signup`,
    LOGIN: `${API_URL}/api/auth/login`,
    VERIFY_OTP: `${API_URL}/api/auth/verify-otp`,
    RESEND_OTP: `${API_URL}/api/auth/resend-otp`,
    RESET_PASSWORD: `${API_URL}/api/auth/reset-password`,
    CONFIRM_RESET: `${API_URL}/api/auth/confirm-reset`,
};
