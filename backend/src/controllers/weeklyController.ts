import { Response } from 'express';
import { WeeklyService } from '../services/weeklyService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const weeklyService = new WeeklyService();

export const getWeeklyStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const status = await weeklyService.getWeeklyStatus(req.user.id);
        res.json(status);
    } catch (error: any) {
        console.error('Error in getWeeklyStatus:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const submitWeeklyEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const result = await weeklyService.submitWeeklyEntry(req.user.id, req.body);
        res.json(result);
    } catch (error: any) {
        console.error('Error in submitWeeklyEntry:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const getUploadUrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const result = await weeklyService.getUploadUrl(req.user.id);
        res.json(result);
    } catch (error: any) {
        console.error('Error in getUploadUrl:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const uploadAudio = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const result = await weeklyService.uploadAudio(req.user.id, req.file.buffer, req.file.mimetype);
        res.json(result);
    } catch (error: any) {
        console.error('Error in uploadAudio:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const getWeeklyVideo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Requires authentication but is generic content
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const result = await weeklyService.getWeeklyVideo();
        res.json(result);
    } catch (error: any) {
        console.error('Error in getWeeklyVideo:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
