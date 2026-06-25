import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { loginSchema, otpSchema, resendOtpSchema, resetPasswordSchema, signupSchema } from '../validation/authSchemas';

/** Derives a display name from email if full_name is absent. */
const getDisplayName = (email: string, fullName?: string): string => {
    if (fullName) return fullName;
    const local = email.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
};

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

        // Sync profile table with display name (always create the row, even without a full_name)
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({ id: data.user.id, username: getDisplayName(email, full_name) });
            if (profileError) console.error('Signup profile upsert error:', profileError.message);
        }

        return res.status(201).json({ message: 'Signup successful', user: data.user });
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
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://mindflow.app/reset-password',
        });

        if (error) throw error;
        return res.status(200).json({ message: 'Password reset link sent to your email.' });
    } catch (error: any) {
        console.error('Reset Password Error:', error.message);
        return res.status(400).json({ error: error.message || 'Failed to send reset email' });
    }
};
