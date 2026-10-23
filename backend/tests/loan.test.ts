import request from 'supertest';
import app from '../src/app';
import { initDb, closeDb } from '../src/config/database';

let authToken: string;
let createdLoanId: number;

beforeAll(async () => {
  process.env.USE_MEMORY_DB = 'true';
  await initDb();

  // Create test user and obtain auth token
  const phone = '+19998887776';
  const otpRes = await request(app).post('/api/auth/send-otp').send({ phone });
  const verifyRes = await request(app).post('/api/auth/verify-otp').send({
    phone,
    otp: otpRes.body.mockOtp,
  });

  authToken = verifyRes.body.token;
});

afterAll(async () => {
  await closeDb();
});

describe('Loans API & Financial Summary', () => {
  it('should reject loan creation with invalid data (negative amount / missing friend)', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        friendName: '',
        amount: -50,
        dueDate: 'invalid-date',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.details).toBeDefined();
  });

  it('should successfully create a new loan entry', async () => {
    // 10 days in future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const dueDateStr = futureDate.toISOString().slice(0, 10);

    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        friendName: 'Alex Smith',
        amount: 250,
        dueDate: dueDateStr,
        notes: 'Lunch and concert tickets',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.friend_name).toBe('Alex Smith');
    expect(res.body.data.amount).toBe(250);
    expect(res.body.data.is_repaid).toBe(false);
    expect(res.body.data.is_overdue).toBe(false);

    createdLoanId = res.body.data.id;
  });

  it('should create an overdue loan entry (due date in past)', async () => {
    // 5 days ago
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const pastDateStr = pastDate.toISOString().slice(0, 10);

    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        friendName: 'Sarah Connor',
        amount: 150,
        dueDate: pastDateStr,
        notes: 'Borrowed for groceries',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.is_overdue).toBe(true);
    expect(res.body.data.is_repaid).toBe(false);
  });

  it('should list all loans with is_overdue flag correctly populated', async () => {
    const res = await request(app)
      .get('/api/loans')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('should filter loans by overdue status', async () => {
    const res = await request(app)
      .get('/api/loans?filter=overdue')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].friend_name).toBe('Sarah Connor');
    expect(res.body.data[0].is_overdue).toBe(true);
  });

  it('should return correct summary: total lent, total repaid, overdue amount', async () => {
    const res = await request(app)
      .get('/api/loans/summary')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const summary = res.body.data;

    // Total Lent = 250 + 150 = 400
    expect(summary.totalLent).toBe(400);
    // Repaid = 0
    expect(summary.totalRepaid).toBe(0);
    // Overdue = 150 (Sarah)
    expect(summary.overdueAmount).toBe(150);
    expect(summary.pendingCount).toBe(2);
    expect(summary.overdueCount).toBe(1);
  });

  it('should mark a loan as repaid and update summary', async () => {
    const res = await request(app)
      .patch(`/api/loans/${createdLoanId}/repay`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.is_repaid).toBe(true);
    expect(res.body.data.repaid_at).toBeDefined();

    // Verify updated summary
    const summaryRes = await request(app)
      .get('/api/loans/summary')
      .set('Authorization', `Bearer ${authToken}`);

    expect(summaryRes.body.data.totalLent).toBe(400);
    expect(summaryRes.body.data.totalRepaid).toBe(250);
    expect(summaryRes.body.data.overdueAmount).toBe(150);
    expect(summaryRes.body.data.repaidCount).toBe(1);
    expect(summaryRes.body.data.pendingCount).toBe(1);
  });
});
