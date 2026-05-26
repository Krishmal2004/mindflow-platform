import { Response } from 'express';
import { DashboardService } from '../services/dashboardService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const dashboardService = new DashboardService();

export const getDashboardSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const summary = await dashboardService.getUserSummary(req.user.id);
        res.json(summary);
    } catch (error) {
        console.error('getDashboardSummary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
