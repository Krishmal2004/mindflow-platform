import express from 'express';
import { getCalendarEvents } from '../controllers/calendarController';
import { AuthenticatedRequest, requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/events', requireAuth, getCalendarEvents);

export default router;
