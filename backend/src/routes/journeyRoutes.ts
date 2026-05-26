import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import { getJourneyData, getJourneyStatus } from '../controllers/journeyController';

const router = Router();

router.get('/status', requireAuth, getJourneyStatus);
router.get('/', requireAuth, getJourneyData);

export default router;
