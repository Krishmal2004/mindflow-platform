import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// Helper to determine greeting name
const getDisplayName = (email: string, fullName?: string) => {
    if (fullName) return fullName;
    const namePart = email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
};

export const signup = async (req: Request, res: Response) => {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: full_name || '',
                }
            }
        });

        if (error) throw error;

        // If user is created, we can optionally update the 'profiles' table if it's not handled by database triggers.
        // Assuming we rely on triggers or just metadata for now.
        // Or we can explicit upsert here if we have Service Role access.
        if (data.user && full_name) {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                username: full_name
            });
        }

        return res.status(200).json({ message: 'Signup successful', user: data.user });
    } catch (error: any) {
        console.error('Signup Error:', error.message);
        return res.status(500).json({ error: error.message || 'Signup failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Fetch profile name or fallback
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
            user: { ...data.user, display_name: displayName }
        });

    } catch (error: any) {
        console.error('Login Error:', error.message);
        const status = error.message.includes('Email not confirmed') ? 403 : 401;
        return res.status(status).json({ error: error.message || 'Login failed' });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    const { email, token, type } = req.body; // type defaults to 'signup'

    if (!email || !token) {
        return res.status(400).json({ error: 'Email and token are required' });
    }

    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: type || 'signup'
        });

        if (error) throw error;

        return res.status(200).json({ message: 'Verified successfully', session: data.session, user: data.user });
    } catch (error: any) {
        console.error('OTP Verify Error:', error.message);
        return res.status(400).json({ error: error.message || 'Verification failed' });
    }
};

export const resendOtp = async (req: Request, res: Response) => {
    const { email, type } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const { error } = await supabase.auth.resend({
            email,
            type: type || 'signup'
        });

        if (error) throw error;

        return res.status(200).json({ message: `OTP resent to ${email}` });
    } catch (error: any) {
        console.error('Resend OTP Error:', error.message);
        return res.status(400).json({ error: error.message || 'Failed to resend OTP' });
    }
};
