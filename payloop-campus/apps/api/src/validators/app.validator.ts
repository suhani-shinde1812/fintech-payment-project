import { z } from 'zod';

export const createPaymentSchema = z.object({
  merchantId: z.string().uuid('Invalid merchant ID'),
  amount: z.number().positive('Amount must be positive').max(50000, 'Amount exceeds maximum limit'),
  offerId: z.string().uuid().optional(),
  notes: z.string().max(200).optional()
});

export const confirmPaymentSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID')
});

export const createBillSchema = z.object({
  title: z.string().min(1).max(100),
  total: z.number().positive(),
  splitType: z.enum(['EQUAL', 'CUSTOM', 'PERCENTAGE']),
  notes: z.string().max(500).optional(),
  participants: z.array(z.object({
    userId: z.string().uuid(),
    amount: z.number().positive().optional(),
    percentage: z.number().min(0).max(100).optional()
  })).min(1, 'At least one participant is required')
});

export const createOfferSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  discountType: z.enum(['PERCENTAGE', 'FLAT']),
  discountValue: z.number().positive(),
  minSpend: z.number().min(0).default(0),
  maxDiscount: z.number().positive().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  usageLimit: z.number().int().positive().optional(),
  isStudentOnly: z.boolean().default(true),
  categoryId: z.string().uuid().optional()
});

export const createSavingsGoalSchema = z.object({
  title: z.string().min(1).max(100),
  goalType: z.enum(['LAPTOP', 'PHONE', 'TRIP', 'EMERGENCY_FUND', 'COLLEGE_FEES', 'CUSTOM']).default('CUSTOM'),
  target: z.number().positive(),
  current: z.number().min(0).default(0),
  deadline: z.string().datetime().optional()
});

export const redeemRewardSchema = z.object({
  rewardId: z.string().uuid('Invalid reward ID')
});

export const addExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.enum(['Food', 'Travel', 'Shopping', 'Education', 'Entertainment', 'Bills', 'Other']),
  description: z.string().min(1).max(200),
  merchantName: z.string().optional(),
  date: z.string().datetime().optional()
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreateBillInput = z.infer<typeof createBillSchema>;
export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>;
