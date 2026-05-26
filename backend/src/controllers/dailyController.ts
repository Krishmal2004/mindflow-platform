import { Response } from 'express';
import { z } from 'zod';
import { DailyService } from '../services/dailyService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const dailyService = new DailyService();

/** Daily sliders: all core metrics are 1–5 per DB CHECK constraints. */
const dailyEntrySchema = z.object({
    stress_level: z.number().int().min(1).max(5),
    mood: z.number().int().min(1).max(5),
    sleep_quality: z.number().int().min(1).max(5),
    relaxation_level: z.number().int().min(1).max(5),
    sleep_start_time: z.string().optional().nullable(),
    wake_up_time: z.string().optional().nullable(),
    feelings: z.string().max(2000).optional().nullable(),
    mindfulness_practice: z.enum(['yes', 'no']).optional().nullable(),
    practice_duration: z.number().min(0).max(1440).optional().nullable(),
    practice_log: z.string().max(2000).optional().nullable(),
});

export const getDailyStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const status = await dailyService.getDailyStatus(req.user.id);

        if (status.completed) {
            const history = await dailyService.getRecentHistory(req.user.id);
            res.json({ ...status, history });
        } else {
            res.json(status);
        }
    } catch (error: any) {
        console.error('getDailyStatus:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const submitDailyEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const validation = dailyEntrySchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Invalid submission', details: validation.error.issues });
            return;
        }

        const result = await dailyService.submitDailyEntry(req.user.id, validation.data);
        const history = await dailyService.getRecentHistory(req.user.id);
        res.json({ ...result, history });
    } catch (error: any) {
        console.error('submitDailyEntry:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const updateVideoProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const { seconds } = req.body;
        if (typeof seconds !== 'number' || seconds < 0) {
            res.status(400).json({ error: 'Seconds must be a non-negative number' });
            return;
        }

        const result = await dailyService.updateVideoProgress(req.user.id, seconds);
        res.json(result);
    } catch (error: any) {
        console.error('updateVideoProgress:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
