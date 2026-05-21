import { Response } from 'express';
import { z } from 'zod';
import { ThriveService } from '../services/thriveService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const thriveService = new ThriveService();

/** WEMWBS-14 answer schema: 14 questions, each 1–5. */
const thriveSchema = z.object({
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
    duration: z.number().nonnegative().optional(),
});

export const getThriveStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const status = await thriveService.getThriveStatus(req.user.id);
        res.json(status);
    } catch (error: any) {
        console.error('getThriveStatus:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const submitThriveEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const validation = thriveSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Invalid submission', details: validation.error.issues });
            return;
        }

        const result = await thriveService.submitThriveEntry(req.user.id, validation.data);
        res.json(result);
    } catch (error: any) {
        console.error('submitThriveEntry:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
