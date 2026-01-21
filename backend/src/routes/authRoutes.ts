import { Router } from 'express';
import { signup, login, verifyOtp, resendOtp } from '../controllers/authController';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

export default router;
