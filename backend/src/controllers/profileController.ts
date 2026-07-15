import { Response } from 'express';
import { z } from 'zod';
import { ProfileService } from '../services/profileService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const profileService = new ProfileService();

// Server-side mirror of AboutMeScreen's required-field validation, so a client can't mark onboarding complete while skipping fields.
const aboutMeSchema = z.object({
    university_id: z.string().trim().max(200).optional().nullable(),
    education_level: z.string().trim().max(200).optional().nullable(),
    faculty: z.string().trim().max(200).optional().nullable(),
    major_field_of_study: z.string().trim().max(200).optional().nullable(),
    age: z.number().int().positive().max(150).optional().nullable(),
    living_situation: z.string().trim().max(200).optional().nullable(),
    family_background: z.string().trim().max(2000).optional().nullable(),
    cultural_background: z.string().trim().max(200).optional().nullable(),
    hobbies_interests: z.string().trim().max(2000).optional().nullable(),
    personal_goals: z.string().trim().max(2000).optional().nullable(),
    why_mindflow: z.string().trim().max(2000).optional().nullable(),
    is_completed: z.boolean().optional(),
}).superRefine((body, ctx) => {
    if (!body.is_completed) return;
    const required = [
        'university_id', 'education_level', 'faculty', 'major_field_of_study',
        'living_situation', 'family_background', 'cultural_background',
        'hobbies_interests', 'why_mindflow',
    ] as const;
    for (const field of required) {
        if (!body[field] || (body[field] as string).length === 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${field} is required to complete onboarding` });
        }
    }
    if (!body.age || body.age <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['age'], message: 'A valid age is required to complete onboarding' });
    }
});

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const profile = await profileService.getProfile(req.user.id);
        res.json({ ...profile, email: req.user.email || null });
    } catch (error: any) {
        console.error('getProfile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAboutMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const data = await profileService.getAboutMe(req.user.id);
        res.json(data);
    } catch (error: any) {
        console.error('getAboutMe:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateAboutMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const validation = aboutMeSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Invalid submission', details: validation.error.issues });
            return;
        }

        const result = await profileService.updateAboutMe(req.user.id, validation.data);
        res.json(result);
    } catch (error: any) {
        console.error('updateAboutMe:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
