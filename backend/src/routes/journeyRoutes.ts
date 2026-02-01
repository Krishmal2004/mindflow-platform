import express from 'express';
import { getJourneyData, getJourneyStatus } from '../controllers/journeyController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/status', requireAuth, getJourneyStatus);
router.get('/', requireAuth, getJourneyData);

export default router;
