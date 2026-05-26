import { Response } from 'express';
import { z } from 'zod';
import { StressService } from '../services/stressService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const stressService = new StressService();

/** PSS-10 answer schema: 10 questions, each 1–5. */
const stressSchema = z.object({
    q1: z.number().int().min(1).max(5),
    q2: z.number().int().min(1).max(5),
    q3: z.number().int().min(1).max(5),
    q4: z.number().int().min(1).max(5),
    q5: z.number().int().min(1).max(5),
    q6: z.number().int().min(1).max(5),
    q7: z.number().int().min(1).max(5),
    q8: z.number().int().min(1).max(5),
    q9: z.number().int().min(1).max(5),
    q10: z.number().int().min(1).max(5),
    duration: z.number().nonnegative().optional(),
});

export const getStressStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const status = await stressService.getStressStatus(req.user.id);
        res.json(status);
    } catch (error: any) {
        console.error('getStressStatus:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const submitStressEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const validation = stressSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Invalid submission', details: validation.error.issues });
            return;
        }

        const result = await stressService.submitStressEntry(req.user.id, validation.data);
        res.json(result);
    } catch (error: any) {
        console.error('submitStressEntry:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
