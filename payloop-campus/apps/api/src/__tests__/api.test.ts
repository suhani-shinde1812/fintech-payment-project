import request from 'supertest';
import app from '../../app';

// Mock Prisma
jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    studentProfile: { findUnique: jest.fn() },
    merchantProfile: { findFirst: jest.fn() },
    merchantCategory: { findFirst: jest.fn() },
    auditLog: { create: jest.fn() },
  }
}));

const mockPrisma = require('../../config/database').prisma;

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.merchantCategory.findFirst.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'STUDENT',
        passwordHash: 'hashed',
        isActive: true,
        studentProfile: {
          id: 'profile-1',
          college: 'Test College',
          course: 'B.Tech',
          year: 2
        },
        merchantProfile: null
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@test.com',
        password: 'Test@12345',
        confirmPassword: 'Test@12345',
        role: 'STUDENT',
        college: 'Test College',
        course: 'B.Tech',
        year: 2
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject registration with mismatched passwords', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@test.com',
        password: 'Test@12345',
        confirmPassword: 'Different@123',
        role: 'STUDENT',
        college: 'Test College',
        course: 'B.Tech',
        year: 2
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'not-an-email',
        password: 'Test@12345',
        confirmPassword: 'Test@12345',
        role: 'STUDENT',
        college: 'Test College',
        course: 'B.Tech',
        year: 2
      });

      expect(res.status).toBe(400);
    });

    it('should reject duplicate email registration', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'test@test.com' });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@test.com',
        password: 'Test@12345',
        confirmPassword: 'Test@12345',
        role: 'STUDENT',
        college: 'Test College',
        course: 'B.Tech',
        year: 2
      });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_TAKEN');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@test.com',
        password: 'wrongpassword'
      });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with missing fields', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@test.com'
      });

      expect(res.status).toBe(400);
    });
  });
});

describe('Helpers', () => {
  const { calculatePoints, calculateLevel, generateTransactionRef, generateCouponCode } = require('../../utils/helpers');

  test('calculatePoints: ₹100 = 5 points', () => {
    expect(calculatePoints(100)).toBe(5);
  });

  test('calculatePoints: ₹300 = 15 points', () => {
    expect(calculatePoints(300)).toBe(15);
  });

  test('calculateLevel: 0 points = Level 1 Newbie', () => {
    const level = calculateLevel(0);
    expect(level.level).toBe(1);
    expect(level.name).toBe('Newbie');
  });

  test('calculateLevel: 2000 points = Level 3 Smart Saver', () => {
    const level = calculateLevel(2000);
    expect(level.level).toBe(3);
    expect(level.name).toBe('Smart Saver');
  });

  test('generateTransactionRef: starts with PL-DEMO-', () => {
    const ref = generateTransactionRef();
    expect(ref).toMatch(/^PL-DEMO-[A-F0-9]{8}$/);
  });

  test('generateCouponCode: starts with PL-', () => {
    const code = generateCouponCode();
    expect(code).toMatch(/^PL-[A-F0-9]{6}$/);
  });
});

describe('Demo Payment Provider', () => {
  const { DemoPaymentProvider } = require('../../services/paymentProvider');

  test('should succeed for all payments', async () => {
    const provider = new DemoPaymentProvider();
    const result = await provider.createPayment({
      amount: 500,
      studentId: 'student-1',
      merchantId: 'merchant-1'
    });

    expect(result.success).toBe(true);
    expect(result.providerName).toBe('DEMO');
    expect(result.amount).toBe(500);
    expect(result.metadata?.note).toContain('NO REAL MONEY');
  });

  test('isDemo should be true', () => {
    const provider = new DemoPaymentProvider();
    expect(provider.isDemo).toBe(true);
  });

  test('getPaymentStatus should return COMPLETED', async () => {
    const provider = new DemoPaymentProvider();
    const status = await provider.getPaymentStatus('DEMO-REF-123');
    expect(status.status).toBe('COMPLETED');
  });
});
