import request from 'supertest';
import app from '../src/app';
import { initDb, closeDb } from '../src/config/database';

beforeAll(async () => {
  process.env.USE_MEMORY_DB = 'true';
  await initDb();
});

afterAll(async () => {
  await closeDb();
});

describe('Authentication & Mock OTP Flow', () => {
  const testPhone = '+19876543210';
  let capturedOtp: string;

  it('should reject invalid phone numbers', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: 'invalid-phone' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should successfully send mock OTP and log it', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: testPhone });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.mockOtp).toBeDefined();
    expect(res.body.mockOtp).toMatch(/^\d{6}$/);

    capturedOtp = res.body.mockOtp;
  });

  it('should reject incorrect OTP code', async () => {
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhone, otp: '000000' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('should verify correct OTP and return JWT token and user info', async () => {
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhone, otp: capturedOtp });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.phone).toBe(testPhone);
  });

  it('should access /api/auth/me with valid Bearer token', async () => {
    // Generate new OTP & verify
    const otpRes = await request(app).post('/api/auth/send-otp').send({ phone: '+1122334455' });
    const verifyRes = await request(app).post('/api/auth/verify-otp').send({
      phone: '+1122334455',
      otp: otpRes.body.mockOtp,
    });

    const token = verifyRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.user.phone).toBe('+1122334455');
  });

  it('should reject unauthenticated request to /api/auth/me', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
