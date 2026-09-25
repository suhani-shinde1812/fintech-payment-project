import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { generateMerchantQrId } from '../utils/helpers';
import { logger } from '../utils/logger';

const SALT_ROUNDS = 12;

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);

      // Check if email exists
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) {
        throw new AppError(409, 'An account with this email already exists', 'EMAIL_TAKEN');
      }

      const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

      // Get default merchant category if needed
      let categoryId = data.categoryId;
      if (data.role === 'MERCHANT' && !categoryId) {
        const defaultCat = await prisma.merchantCategory.findFirst();
        categoryId = defaultCat?.id;
      }

      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: data.role,
          studentProfile: data.role === 'STUDENT' ? {
            create: {
              college: data.college!,
              course: data.course!,
              year: data.year!,
              demoBalance: 5000.00,
              totalPoints: 0
            }
          } : undefined,
          merchantProfile: data.role === 'MERCHANT' ? {
            create: {
              businessName: data.businessName!,
              address: data.address!,
              phone: data.phone!,
              categoryId: categoryId!,
              qrCode: generateMerchantQrId(),
              status: 'PENDING'
            }
          } : undefined
        },
        include: {
          studentProfile: true,
          merchantProfile: true
        }
      });

      // Log registration
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
      );

      const { passwordHash: _, ...userWithoutPassword } = user;

      logger.info(`New ${data.role} registered: ${data.email}`);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: { user: userWithoutPassword, token }
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          studentProfile: true,
          merchantProfile: { include: { category: true } }
        }
      });

      if (!user || !await bcrypt.compare(password, user.passwordHash)) {
        throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
      }

      if (!user.isActive) {
        throw new AppError(403, 'Your account has been suspended. Please contact support.', 'ACCOUNT_SUSPENDED');
      }

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
      );

      const { passwordHash: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Login successful',
        data: { user: userWithoutPassword, token }
      });
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: {
          studentProfile: true,
          merchantProfile: { include: { category: true } }
        }
      });

      if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');

      const { passwordHash: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: { user: userWithoutPassword }
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await prisma.auditLog.create({
          data: {
            userId: req.user.userId,
            action: 'LOGOUT',
            ipAddress: req.ip
          }
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
