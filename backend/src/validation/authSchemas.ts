import { z } from 'zod';

export const signupSchema = z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    full_name: z.string().max(200).optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(1, 'Password is required'),
});

export const otpSchema = z.object({
    email: z.string().email('Valid email is required'),
    token: z.string().min(4).max(10),
    type: z.string().optional(),
});

export const resendOtpSchema = z.object({
    email: z.string().email('Valid email is required'),
    type: z.string().optional(),
});

export const resetPasswordSchema = z.object({
    email: z.string().email('Valid email is required'),
});
