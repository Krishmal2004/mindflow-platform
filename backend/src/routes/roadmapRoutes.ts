import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import * as dailyController from '../controllers/dailyController';
import * as weeklyController from '../controllers/weeklyController';
import * as questionnaireController from '../controllers/questionnaireController';
import * as calendarController from '../controllers/calendarController';

const router = Router();

// Daily Sliders
router.get('/daily/status', requireAuth, dailyController.getDailyStatus);
router.post('/daily', requireAuth, dailyController.submitDailyEntry);

// Weekly Whispers
router.get('/weekly/status', requireAuth, weeklyController.getWeeklyStatus);
router.post('/weekly', requireAuth, weeklyController.submitWeeklyEntry);

// Main Questionnaire
router.get('/questionnaire/active', requireAuth, questionnaireController.getActiveQuestionnaire);
router.get('/questionnaire/status', requireAuth, questionnaireController.getQuestionnaireStatus);
router.post('/questionnaire/submit', requireAuth, questionnaireController.submitQuestionnaire);

// Calendar
router.get('/calendar/events', requireAuth, calendarController.getCalendarEvents);

export default router;
