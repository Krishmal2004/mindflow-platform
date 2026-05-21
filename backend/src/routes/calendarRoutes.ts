import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import { getCalendarEvents } from '../controllers/calendarController';

const router = Router();

router.get('/events', requireAuth, getCalendarEvents);

export default router;
