import { query } from '../config/database';
import { generateToken } from '../middleware/authMiddleware';

export interface User {
  id: number;
  phone: string;
  created_at: string;
}

export class AuthService {
  /**
   * Generates a 6-digit mock OTP, saves to database with 5 min validity, and prints to server console
   */
  static async requestOtp(phone: string): Promise<{ message: string; mockOtp: string }> {
    // Generate 6-digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Store in database
    await query(
      `INSERT INTO otps (phone, otp_code, expires_at) VALUES ($1, $2, $3)`,
      [phone, otpCode, expiresAt]
    );

    // Assignment requirement: Print OTP in server log
    console.log('\n======================================================');
    console.log(`🔑 [MOCK OTP] Phone: ${phone} | Code: ${otpCode}`);
    console.log(`⏱️  Expires at: ${expiresAt.toLocaleTimeString()}`);
    console.log('======================================================\n');

    return {
      message: `OTP sent successfully. Check your server console for the code.`,
      mockOtp: otpCode, // also returned in response for seamless automated tests and rapid developer evaluation
    };
  }

  /**
   * Verifies the OTP, finds or creates user, and issues a JWT token
   */
  static async verifyOtp(phone: string, code: string): Promise<{ token: string; user: User }> {
    const now = new Date();

    // Check if OTP matches and has not expired
    const otpResult = await query(
      `SELECT * FROM otps 
       WHERE phone = $1 AND otp_code = $2 AND expires_at > $3 
       ORDER BY id DESC LIMIT 1`,
      [phone, code, now]
    );

    if (otpResult.rows.length === 0) {
      throw new Error('Invalid or expired OTP. Please request a new one.');
    }

    // Clean up used OTPs for this phone
    await query(`DELETE FROM otps WHERE phone = $1`, [phone]);

    // Find or create user
    let userResult = await query<User>(`SELECT * FROM users WHERE phone = $1`, [phone]);

    let user: User;
    if (userResult.rows.length === 0) {
      const newUserRes = await query<User>(
        `INSERT INTO users (phone) VALUES ($1) RETURNING *`,
        [phone]
      );
      user = newUserRes.rows[0];
    } else {
      user = userResult.rows[0];
    }

    const token = generateToken({
      userId: user.id,
      phone: user.phone,
    });

    return {
      token,
      user,
    };
  }

  /**
   * Fetches user by ID
   */
  static async getUserById(userId: number): Promise<User | null> {
    const result = await query<User>(`SELECT id, phone, created_at FROM users WHERE id = $1`, [userId]);
    return result.rows[0] || null;
  }
}
