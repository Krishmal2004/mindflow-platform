import { Router } from 'express';
import { signup, login, verifyOtp, resendOtp, resetPassword, confirmPasswordReset } from '../controllers/authController';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/reset-password', resetPassword);
router.post('/confirm-reset', confirmPasswordReset);

export default router;
