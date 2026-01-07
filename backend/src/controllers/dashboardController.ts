import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const dashboardService = new DashboardService();

export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;

        if (!authReq.user || !authReq.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const summary = await dashboardService.getUserSummary(authReq.user.id);
        res.json(summary);
    } catch (error) {
        console.error('Error in getDashboardSummary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
