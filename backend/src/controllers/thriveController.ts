import { Response } from 'express';
import { ThriveService } from '../services/thriveService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const thriveService = new ThriveService();

export const getThriveStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const status = await thriveService.getThriveStatus(req.user.id);
        res.json(status);
    } catch (error: any) {
        console.error('Error in getThriveStatus:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const submitThriveEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const result = await thriveService.submitThriveEntry(req.user.id, req.body);
        res.json(result);
    } catch (error: any) {
        console.error('Error in submitThriveEntry:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
