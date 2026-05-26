import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import { getDashboardSummary } from '../controllers/dashboardController';

const router = Router();

router.get('/summary', requireAuth, getDashboardSummary);

export default router;
