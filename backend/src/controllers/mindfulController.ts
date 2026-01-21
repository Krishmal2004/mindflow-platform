import { Response } from 'express';
import { MindfulService } from '../services/mindfulService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const mindfulService = new MindfulService();

export const getMindfulStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const status = await mindfulService.getMindfulStatus(req.user.id);
        res.json(status);
    } catch (error: any) {
        console.error('Error in getMindfulStatus:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const submitMindfulEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const result = await mindfulService.submitMindfulEntry(req.user.id, req.body);
        res.json(result);
    } catch (error: any) {
        console.error('Error in submitMindfulEntry:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
