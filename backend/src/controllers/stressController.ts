import { Response } from 'express';
import { StressService } from '../services/stressService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const stressService = new StressService();

export const getStressStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const status = await stressService.getStressStatus(req.user.id);
        res.json(status);
    } catch (error: any) {
        console.error('Error in getStressStatus:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const submitStressEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const result = await stressService.submitStressEntry(req.user.id, req.body);
        res.json(result);
    } catch (error: any) {
        console.error('Error in submitStressEntry:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
