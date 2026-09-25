import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { getPagination } from '../utils/helpers';

export const offerController = {
  async getOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, search, sort = 'createdAt', page, limit } = req.query;
      const { skip, take } = getPagination(page, limit);

      const where: {
        status: 'ACTIVE';
        endDate: { gt: Date };
        categoryId?: string;
        title?: { contains: string; mode: 'insensitive' };
      } = {
        status: 'ACTIVE',
        endDate: { gt: new Date() }
      };

      if (category && category !== 'all') {
        where.categoryId = category as string;
      }

      if (search) {
        where.title = { contains: search as string, mode: 'insensitive' };
      }

      const orderByOptions: Record<string, object> = {
        createdAt: { createdAt: 'desc' },
        discount: { discountValue: 'desc' },
        endDate: { endDate: 'asc' }
      };

      const [offers, total, categories] = await Promise.all([
        prisma.offer.findMany({
          where,
          include: { merchant: { include: { category: true } }, category: true },
          orderBy: orderByOptions[sort as string] || { createdAt: 'desc' },
          skip,
          take
        }),
        prisma.offer.count({ where }),
        prisma.merchantCategory.findMany()
      ]);

      res.json({
        success: true,
        data: { offers, total, categories }
      });
    } catch (error) {
      next(error);
    }
  },

  async getOfferById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const offer = await prisma.offer.findUnique({
        where: { id },
        include: { merchant: { include: { category: true } }, category: true }
      });

      if (!offer) throw new AppError(404, 'Offer not found', 'OFFER_NOT_FOUND');

      // Log offer view
      if (req.user) {
        await prisma.auditLog.create({
          data: {
            userId: req.user.userId,
            action: 'OFFER_VIEWED',
            metadata: { offerId: id }
          }
        });
      }

      res.json({ success: true, data: { offer } });
    } catch (error) {
      next(error);
    }
  },

  async getMerchantById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const merchant = await prisma.merchantProfile.findUnique({
        where: { id },
        include: {
          category: true,
          offers: {
            where: { status: 'ACTIVE', endDate: { gt: new Date() } }
          }
        }
      });

      if (!merchant || merchant.status !== 'APPROVED') {
        throw new AppError(404, 'Merchant not found', 'MERCHANT_NOT_FOUND');
      }

      res.json({ success: true, data: { merchant } });
    } catch (error) {
      next(error);
    }
  },

  async getAllMerchants(req: Request, res: Response, next: NextFunction) {
    try {
      const merchants = await prisma.merchantProfile.findMany({
        where: { status: 'APPROVED' },
        include: { category: true, user: { select: { name: true, email: true } } },
        orderBy: { businessName: 'asc' }
      });

      res.json({ success: true, data: { merchants } });
    } catch (error) {
      next(error);
    }
  }
};
