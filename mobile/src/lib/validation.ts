// Shared auth-form validation — single source of truth for email format and password
// strength scoring, used by Signup, Login/ForgotPassword, and the reset-OTP screen.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

export function getStrength(pwd: string): StrengthLevel {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return Math.min(score, 4) as StrengthLevel;
}

export const STRENGTH_LABEL: Record<StrengthLevel, string> = { 0: '', 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' };
export const STRENGTH_COLOR: Record<StrengthLevel, string> = {
    0: '#E0E6ED', 1: '#EF5350', 2: '#FFA726', 3: '#66BB6A', 4: '#2E7D32',
};
