import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import { registerPushToken, unregisterPushToken } from '../controllers/notificationController';

const router = Router();

router.post('/register-token', requireAuth, registerPushToken);
router.post('/unregister-token', requireAuth, unregisterPushToken);

export default router;
