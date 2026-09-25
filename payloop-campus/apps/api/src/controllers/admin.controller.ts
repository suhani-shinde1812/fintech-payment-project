import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { getPagination } from '../utils/helpers';

export const adminController = {
  async getDashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalStudents,
        totalMerchants,
        totalTransactions,
        totalOffers,
        totalPoints,
        pendingMerchants,
        recentTransactions,
        activeUsers
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.user.count({ where: { role: 'MERCHANT' } }),
        prisma.transaction.count(),
        prisma.offer.count({ where: { status: 'ACTIVE' } }),
        prisma.studentProfile.aggregate({ _sum: { totalPoints: true } }),
        prisma.merchantProfile.count({ where: { status: 'PENDING' } }),
        prisma.transaction.findMany({
          include: {
            student: { include: { user: true } },
            merchant: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        prisma.user.count({ where: {
          auditLogs: {
            some: {
              action: 'LOGIN',
              createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          }
        }})
      ]);

      res.json({
        success: true,
        data: {
          stats: {
            totalStudents,
            totalMerchants,
            totalTransactions,
            totalOffers,
            totalPointsEarned: totalPoints._sum.totalPoints || 0,
            pendingMerchants,
            activeUsers
          },
          recentTransactions
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { skip, take, page, limit } = getPagination(req.query.page, req.query.limit);
      const role = req.query.role as string;

      const where = role ? { role: role as 'STUDENT' | 'MERCHANT' | 'ADMIN' } : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            studentProfile: true,
            merchantProfile: { include: { category: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          omit: { passwordHash: true }
        }),
        prisma.user.count({ where })
      ]);

      res.json({ success: true, data: { users, total, page, limit } });
    } catch (error) {
      next(error);
    }
  },

  async getMerchants(req: Request, res: Response, next: NextFunction) {
    try {
      const { skip, take, page, limit } = getPagination(req.query.page, req.query.limit);
      const status = req.query.status as string;

      const where = status ? { status: status as 'PENDING' | 'APPROVED' | 'SUSPENDED' } : {};

      const [merchants, total] = await Promise.all([
        prisma.merchantProfile.findMany({
          where,
          include: { user: { omit: { passwordHash: true } }, category: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take
        }),
        prisma.merchantProfile.count({ where })
      ]);

      res.json({ success: true, data: { merchants, total, page, limit } });
    } catch (error) {
      next(error);
    }
  },

  async approveMerchant(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['APPROVED', 'SUSPENDED', 'PENDING'].includes(status)) {
        throw new AppError(400, 'Invalid status', 'INVALID_STATUS');
      }

      const merchant = await prisma.merchantProfile.update({
        where: { id },
        data: { status }
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'MERCHANT_APPROVED',
          metadata: { merchantId: id, status }
        }
      });

      res.json({ success: true, data: { merchant } });
    } catch (error) {
      next(error);
    }
  },

  async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: { isActive }
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'USER_SUSPENDED',
          metadata: { targetUserId: id, isActive }
        }
      });

      res.json({ success: true, data: { user: { id: user.id, isActive: user.isActive } } });
    } catch (error) {
      next(error);
    }
  },

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { skip, take, page, limit } = getPagination(req.query.page, req.query.limit);

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          include: {
            student: { include: { user: { omit: { passwordHash: true } } } },
            merchant: true,
            payment: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take
        }),
        prisma.transaction.count()
      ]);

      res.json({ success: true, data: { transactions, total, page, limit } });
    } catch (error) {
      next(error);
    }
  },

  async getOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string;
      const where = status ? { status: status as 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'PENDING_APPROVAL' | 'REJECTED' } : {};

      const offers = await prisma.offer.findMany({
        where,
        include: { merchant: true, category: true },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: { offers } });
    } catch (error) {
      next(error);
    }
  },

  async updateOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const offer = await prisma.offer.update({
        where: { id },
        data: { status }
      });

      res.json({ success: true, data: { offer } });
    } catch (error) {
      next(error);
    }
  },

  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.merchantCategory.findMany({
        orderBy: { name: 'asc' }
      });
      res.json({ success: true, data: { categories } });
    } catch (error) {
      next(error);
    }
  }
};
