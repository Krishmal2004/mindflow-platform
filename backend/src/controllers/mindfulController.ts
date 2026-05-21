import { Response } from 'express';
import { z } from 'zod';
import { MindfulService } from '../services/mindfulService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const mindfulService = new MindfulService();

/** FFMQ-15 answer schema: 15 questions, each 1–5. */
const mindfulSchema = z.object({
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
    q11: z.number().int().min(1).max(5),
    q12: z.number().int().min(1).max(5),
    q13: z.number().int().min(1).max(5),
    q14: z.number().int().min(1).max(5),
    q15: z.number().int().min(1).max(5),
    duration: z.number().nonnegative().optional(),
});

export const getMindfulStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const status = await mindfulService.getMindfulStatus(req.user.id);
        res.json(status);
    } catch (error: any) {
        console.error('getMindfulStatus:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const submitMindfulEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const validation = mindfulSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Invalid submission', details: validation.error.issues });
            return;
        }

        const result = await mindfulService.submitMindfulEntry(req.user.id, validation.data);
        res.json(result);
    } catch (error: any) {
        console.error('submitMindfulEntry:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
