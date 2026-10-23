import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJwt } from '../middleware/authMiddleware';

const router = Router();

// Public auth endpoints
router.post('/send-otp', AuthController.sendOtp);
router.post('/verify-otp', AuthController.verifyOtp);

// Authenticated user endpoint
router.get('/me', authenticateJwt, AuthController.getMe);

export default router;
