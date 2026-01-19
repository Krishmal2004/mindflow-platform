import { Response } from 'express';
import { DailyService } from '../services/dailyService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const dailyService = new DailyService();

export const getDailyStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const status = await dailyService.getDailyStatus(req.user.id);
        res.json(status);
    } catch (error: any) {
        console.error('Error in getDailyStatus:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const submitDailyEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const result = await dailyService.submitDailyEntry(req.user.id, req.body);
        res.json(result);
    } catch (error: any) {
        console.error('Error in submitDailyEntry:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const updateVideoProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const { seconds } = req.body;
        if (typeof seconds !== 'number') {
            res.status(400).json({ error: 'Seconds must be a number' });
            return;
        }
        const result = await dailyService.updateVideoProgress(req.user.id, seconds);
        res.json(result);
    } catch (error: any) {
        console.error('Error in updateVideoProgress:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
