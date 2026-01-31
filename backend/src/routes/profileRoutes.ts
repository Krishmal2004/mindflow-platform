import { Router } from 'express';
import { getProfile, getAboutMe, updateAboutMe } from '../controllers/profileController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', requireAuth, getProfile);
router.get('/about-me', requireAuth, getAboutMe);
router.post('/about-me', requireAuth, updateAboutMe);

export default router;
