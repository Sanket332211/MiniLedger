import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { sendOtpSchema, verifyOtpSchema } from '../utils/validation';

export class AuthController {
  /**
   * POST /api/auth/send-otp
   */
  static async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = sendOtpSchema.parse(req.body);
      const result = await AuthService.requestOtp(validated.phone);

      res.status(200).json({
        success: true,
        message: result.message,
        // Also returning mockOtp in JSON for easy local testing & evaluation
        mockOtp: result.mockOtp,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/verify-otp
   */
  static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = verifyOtpSchema.parse(req.body);
      const result = await AuthService.verifyOtp(validated.phone, validated.otp);

      res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   */
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const user = await AuthService.getUserById(req.user.userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }
}
