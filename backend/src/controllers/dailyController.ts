import { Response } from 'express';
import { z } from 'zod';
import { DailyService } from '../services/dailyService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const dailyService = new DailyService();

/** Daily sliders: all core metrics are 1–5 per DB CHECK constraints. */
const dailyEntrySchema = z.object({
    stress_level: z.number().int().min(1).max(5),
    calm_before: z.number().int().min(1).max(5),
    calm_after: z.number().int().min(1).max(5),
    sleep_quality: z.number().int().min(1).max(5),
    sleep_start_time: z.string().optional().nullable(),
    wake_up_time: z.string().optional().nullable(),
    feelings: z.string().max(2000).optional().nullable(),
    mindfulness_practice: z.enum(['yes', 'no']).optional().nullable(),
    practice_duration: z.number().min(0).max(1440).optional().nullable(),
    practice_location: z.enum(['At University', 'Outside University']).optional().nullable(),
}).refine(
    (data) => data.mindfulness_practice !== 'yes' || (typeof data.practice_duration === 'number' && data.practice_duration >= 5),
    { message: 'practice_duration must be at least 5 when mindfulness_practice is yes', path: ['practice_duration'] }
).refine(
    (data) => data.mindfulness_practice !== 'yes' || !!data.practice_location,
    { message: 'practice_location is required when mindfulness_practice is yes', path: ['practice_location'] }
);

export const getDailyStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const status = await dailyService.getDailyStatus(req.user.id);
        res.json(status);
    } catch (error: any) {
        console.error('getDailyStatus:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        res.json(result);
    } catch (error: any) {
        if (error.message === 'DAILY_ALREADY_SUBMITTED') {
            res.status(409).json({ error: 'Already submitted for today. Resets at midnight.' });
            return;
        }
        console.error('submitDailyEntry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateVideoProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const { seconds } = req.body;
        // Upper bound guards against a buggy/malicious client pushing an unbounded
        // increment; WATCH_SYNC_INTERVAL_SECONDS on the client flushes every 5s, so
        // 300 (5 min) comfortably covers normal usage plus background/retry bursts.
        if (typeof seconds !== 'number' || seconds < 0 || seconds > 300) {
            res.status(400).json({ error: 'Seconds must be a number between 0 and 300' });
            return;
        }

        const result = await dailyService.updateVideoProgress(req.user.id, seconds);
        res.json(result);
    } catch (error: any) {
        console.error('updateVideoProgress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
