import { Response } from 'express';
import { z } from 'zod';
import { WeeklyService } from '../services/weeklyService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const weeklyService = new WeeklyService();

/** Schema for weekly voice submission metadata. */
const weeklyEntrySchema = z.object({
    file_url: z.string().url(),
    file_key: z.string().min(1),
    duration: z.number().nonnegative().optional(),
});

export const getWeeklyStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const status = await weeklyService.getWeeklyStatus(req.user.id);
        res.json(status);
    } catch (error: any) {
        console.error('getWeeklyStatus:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const submitWeeklyEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const validation = weeklyEntrySchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Invalid submission', details: validation.error.issues });
            return;
        }

        const result = await weeklyService.submitWeeklyEntry(req.user.id, validation.data);
        res.json(result);
    } catch (error: any) {
        console.error('submitWeeklyEntry:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const getUploadUrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const result = await weeklyService.getUploadUrl(req.user.id);
        res.json(result);
    } catch (error: any) {
        console.error('getUploadUrl:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const uploadAudio = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const result = await weeklyService.uploadAudio(req.user.id, req.file.buffer, req.file.mimetype);
        res.json(result);
    } catch (error: any) {
        console.error('uploadAudio:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const getWeeklyVideo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }
        const result = await weeklyService.getWeeklyVideo();
        res.json(result);
    } catch (error: any) {
        console.error('getWeeklyVideo:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
