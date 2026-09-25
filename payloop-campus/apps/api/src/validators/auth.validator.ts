import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['STUDENT', 'MERCHANT']),
  // Student fields
  college: z.string().optional(),
  course: z.string().optional(),
  year: z.number().int().min(1).max(6).optional(),
  // Merchant fields
  businessName: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
}).refine((data) => {
  if (data.role === 'STUDENT') {
    return data.college && data.course && data.year;
  }
  return true;
}, {
  message: 'College, course, and year are required for students',
  path: ['college']
}).refine((data) => {
  if (data.role === 'MERCHANT') {
    return data.businessName && data.address && data.phone;
  }
  return true;
}, {
  message: 'Business name, address, and phone are required for merchants',
  path: ['businessName']
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
