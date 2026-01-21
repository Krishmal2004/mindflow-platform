import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';
import * as dailyController from '../controllers/dailyController';
import * as weeklyController from '../controllers/weeklyController';
import * as questionnaireController from '../controllers/questionnaireController';
import * as calendarController from '../controllers/calendarController';
import * as thriveController from '../controllers/thriveController';
import * as stressController from '../controllers/stressController';
import * as mindfulController from '../controllers/mindfulController';

const router = Router();

// Daily Sliders
router.get('/daily/status', requireAuth, dailyController.getDailyStatus);
router.post('/daily/video-progress', requireAuth, dailyController.updateVideoProgress);
router.post('/daily', requireAuth, dailyController.submitDailyEntry);

// Weekly Whispers
router.get('/weekly/status', requireAuth, weeklyController.getWeeklyStatus);
router.get('/weekly/video', requireAuth, weeklyController.getWeeklyVideo);
router.post('/weekly/upload', requireAuth, upload.single('file'), weeklyController.uploadAudio);
router.post('/weekly', requireAuth, weeklyController.submitWeeklyEntry);

// Main Questionnaire
router.get('/questionnaire/active', requireAuth, questionnaireController.getActiveQuestionnaire);
router.get('/questionnaire/status', requireAuth, questionnaireController.getQuestionnaireStatus);
router.post('/questionnaire/submit', requireAuth, questionnaireController.submitQuestionnaire);

// Calendar
router.get('/calendar/events', requireAuth, calendarController.getCalendarEvents);

// Thrive Tracker (WEMWBS)
router.get('/thrive/status', requireAuth, thriveController.getThriveStatus);
router.post('/thrive', requireAuth, thriveController.submitThriveEntry);

// Stress Snapshot (PSS-10)
router.get('/stress/status', requireAuth, stressController.getStressStatus);
router.post('/stress', requireAuth, stressController.submitStressEntry);

// Mindful Mirror (FFMQ-15)
router.get('/mindful/status', requireAuth, mindfulController.getMindfulStatus);
router.post('/mindful', requireAuth, mindfulController.submitMindfulEntry);

export default router;
