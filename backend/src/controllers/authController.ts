import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { loginSchema, otpSchema, resendOtpSchema, resetPasswordSchema, confirmResetSchema, signupSchema, refreshTokenSchema } from '../validation/authSchemas';

// Derives a display name from email if full_name is absent; guarantees the DB's username_length CHECK (>= 3 chars).
const getDisplayName = (email: string, fullName?: string): string => {
    if (fullName) return fullName;
    const local = email.split('@')[0];
    const base = local.charAt(0).toUpperCase() + local.slice(1);
    return base.length >= 3 ? base : base.padEnd(3, '0');
};

// Suffixes a username with a short slice of the user id to resolve a UNIQUE collision.
const getFallbackUsername = (base: string, userId: string): string => `${base}_${userId.slice(0, 6)}`;

export const signup = async (req: Request, res: Response) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }
    const { email, password, full_name } = parsed.data;

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: full_name || '' } },
        });

        if (error) throw error;

        // Always creates the profiles row (even without full_name); on a UNIQUE username collision, retry once with an id-suffixed username rather than orphaning the user.
        let profileWarning: string | undefined;
        if (data.user) {
            const displayName = getDisplayName(email, full_name);
            let { error: profileError } = await supabase
                .from('profiles')
                .upsert({ id: data.user.id, username: displayName });

            if (profileError) {
                console.error('Signup profile upsert error, retrying with fallback username:', profileError.message);
                const fallback = getFallbackUsername(displayName, data.user.id);
                const retry = await supabase
                    .from('profiles')
                    .upsert({ id: data.user.id, username: fallback });
                profileError = retry.error;
                if (profileError) {
                    console.error('Signup profile upsert fallback failed:', profileError.message);
                    profileWarning = 'Account created, but profile setup is incomplete. Please contact support.';
                }
            }
        }

        return res.status(201).json({ message: 'Signup successful', user: data.user, ...(profileWarning && { warning: profileWarning }) });
    } catch (error: any) {
        console.error('Signup Error:', error.message);
        return res.status(500).json({ error: error.message || 'Signup failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }
    const { email, password } = parsed.data;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        let displayName = '';
        if (data.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', data.user.id)
                .single();

            displayName = profile?.username || getDisplayName(email, data.user.user_metadata?.full_name);
        }

        return res.status(200).json({
            message: 'Login successful',
            session: data.session,
            user: { ...data.user, display_name: displayName },
        });
    } catch (error: any) {
        console.error('Login Error:', error.message);
        const status = error.message?.includes('Email not confirmed') ? 403 : 401;
        return res.status(status).json({ error: error.message || 'Login failed' });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    const parsed = otpSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }
    const { email, token, type } = parsed.data;

    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: (type || 'signup') as 'signup',
        });

        if (error) throw error;
        return res.status(200).json({ message: 'Verified successfully', session: data.session, user: data.user });
    } catch (error: any) {
        console.error('OTP Verify Error:', error.message);
        return res.status(400).json({ error: error.message || 'Verification failed' });
    }
};

export const resendOtp = async (req: Request, res: Response) => {
    const parsed = resendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }
    const { email, type } = parsed.data;

    try {
        const { error } = await supabase.auth.resend({ email, type: (type || 'signup') as 'signup' });
        if (error) throw error;
        return res.status(200).json({ message: `OTP resent to ${email}` });
    } catch (error: any) {
        console.error('Resend OTP Error:', error.message);
        return res.status(400).json({ error: error.message || 'Failed to resend OTP' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }
    const { email } = parsed.data;

    try {
        // Send OTP for password recovery (requires "Email OTP" enabled in Supabase project)
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        return res.status(200).json({ message: 'A verification code has been sent to your email.' });
    } catch (error: any) {
        console.error('Reset Password Error:', error.message);
        return res.status(400).json({ error: error.message || 'Failed to send reset code' });
    }
};

export const confirmPasswordReset = async (req: Request, res: Response) => {
    const parsed = confirmResetSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }
    const { email, token, newPassword } = parsed.data;

    try {
        // Verify the recovery OTP — returns the user session if valid
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'recovery',
        });
        if (verifyError) throw verifyError;
        if (!data.user) throw new Error('Could not identify user from token');

        // Use service-role admin API to update the password directly
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            data.user.id,
            { password: newPassword },
        );
        if (updateError) throw updateError;

        return res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error: any) {
        console.error('Confirm Reset Error:', error.message);
        return res.status(400).json({ error: error.message || 'Password reset failed' });
    }
};

// Exchanges a long-lived refresh_token for a new access_token, so the mobile client can
// stay signed in past the short-lived access token's expiry without the user re-entering
// their password. Only a truly invalid/revoked refresh_token (expired session, explicit
// sign-out, password change) should ever force the client back to the login screen.
export const refreshToken = async (req: Request, res: Response) => {
    const parsed = refreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }
    const { refresh_token } = parsed.data;

    try {
        const { data, error } = await supabase.auth.refreshSession({ refresh_token });
        if (error) throw error;
        if (!data.session) throw new Error('No session returned');

        return res.status(200).json({ session: data.session, user: data.user });
    } catch (error: any) {
        console.error('Refresh Token Error:', error.message);
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
};
