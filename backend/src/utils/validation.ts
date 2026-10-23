import { z } from 'zod';

export const phoneSchema = z.string().trim().regex(/^\+?[1-9]\d{6,14}$/, {
  message: 'Invalid phone number format. Please provide 7 to 15 digits, optionally prefixed with "+".',
});

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().trim().regex(/^\d{6}$/, {
    message: 'OTP must be exactly 6 digits.',
  }),
});

export const createLoanSchema = z.object({
  friendName: z.string().trim().min(1, 'Friend name is required').max(120, 'Friend name too long'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
  notes: z.string().max(500).optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
});

export const updateLoanStatusSchema = z.object({
  isRepaid: z.boolean(),
});
