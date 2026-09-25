import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { createOfferSchema } from '../validators/app.validator';
import { getPagination } from '../utils/helpers';
import QRCode from 'qrcode';

export const merchantController = {
  async getAllMerchants(_req: Request, res: Response, next: NextFunction) {
    try {
      const merchants = await prisma.merchantProfile.findMany({
        where: { status: 'APPROVED' },
        include: { category: true },
        orderBy: { businessName: 'asc' }
      });
      res.json({ success: true, data: { merchants } });
    } catch (error) {
      next(error);
    }
  },

  async getMerchantById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const merchant = await prisma.merchantProfile.findUnique({
        where: { id },
        include: { category: true, offers: { where: { status: 'ACTIVE' } } }
      });
      if (!merchant) throw new AppError(404, 'Merchant not found', 'MERCHANT_NOT_FOUND');
      res.json({ success: true, data: { merchant } });
    } catch (error) {
      next(error);
    }
  },

  async getDashboard(req: Request, res: Response, next: NextFunction) {

    try {
      const merchant = await prisma.merchantProfile.findUnique({
        where: { userId: req.user!.userId },
        include: { user: true, category: true }
      });
      if (!merchant) throw new AppError(404, 'Merchant not found', 'MERCHANT_NOT_FOUND');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6);

      const [todayStats, monthStats, recentTransactions, activeOffers, dailySales] = await Promise.all([
        prisma.transaction.aggregate({
          where: { merchantId: merchant.id, status: 'COMPLETED', createdAt: { gte: today } },
          _sum: { amount: true },
          _count: true
        }),
        prisma.transaction.aggregate({
          where: { merchantId: merchant.id, status: 'COMPLETED', createdAt: { gte: monthStart } },
          _sum: { amount: true },
          _count: true
        }),
        prisma.transaction.findMany({
          where: { merchantId: merchant.id, status: 'COMPLETED' },
          include: { student: { include: { user: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        prisma.offer.findMany({
          where: { merchantId: merchant.id, status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' }
        }),
        // Last 7 days daily sales
        Promise.all(Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          d.setHours(0, 0, 0, 0);
          const dEnd = new Date(d);
          dEnd.setHours(23, 59, 59, 999);
          return prisma.transaction.aggregate({
            where: { merchantId: merchant.id, status: 'COMPLETED', createdAt: { gte: d, lte: dEnd } },
            _sum: { amount: true },
            _count: true
          }).then(r => ({
            date: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
            sales: r._sum.amount || 0,
            transactions: r._count
          }));
        }))
      ]);

      // Get unique customers
      const uniqueCustomers = await prisma.transaction.groupBy({
        by: ['studentId'],
        where: { merchantId: merchant.id, status: 'COMPLETED' }
      });

      res.json({
        success: true,
        data: {
          merchant,
          stats: {
            today: { sales: todayStats._sum.amount || 0, transactions: todayStats._count },
            month: { sales: monthStats._sum.amount || 0, transactions: monthStats._count },
            totalCustomers: uniqueCustomers.length,
            totalSales: merchant.totalSales
          },
          recentTransactions,
          activeOffers,
          dailySales: dailySales.reverse()
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getQrCode(req: Request, res: Response, next: NextFunction) {
    try {
      const merchant = await prisma.merchantProfile.findUnique({
        where: { userId: req.user!.userId }
      });
      if (!merchant) throw new AppError(404, 'Merchant not found', 'MERCHANT_NOT_FOUND');

      const qrData = `payloop://merchant/${merchant.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 400,
        margin: 2
      });

      res.json({
        success: true,
        data: {
          qrCode: qrCodeDataUrl,
          qrData,
          merchantId: merchant.id,
          businessName: merchant.businessName
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async createOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createOfferSchema.parse(req.body);
      const merchant = await prisma.merchantProfile.findUnique({
        where: { userId: req.user!.userId }
      });
      if (!merchant) throw new AppError(404, 'Merchant not found', 'MERCHANT_NOT_FOUND');
      if (merchant.status !== 'APPROVED') {
        throw new AppError(403, 'Merchant account is not approved yet', 'MERCHANT_NOT_APPROVED');
      }

      const offer = await prisma.offer.create({
        data: {
          merchantId: merchant.id,
          title: data.title,
          description: data.description,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minSpend: data.minSpend,
          maxDiscount: data.maxDiscount,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          usageLimit: data.usageLimit,
          isStudentOnly: data.isStudentOnly,
          categoryId: data.categoryId,
          status: 'PENDING_APPROVAL'
        }
      });

      res.status(201).json({ success: true, data: { offer } });
    } catch (error) {
      next(error);
    }
  },

  async getOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const merchant = await prisma.merchantProfile.findUnique({
        where: { userId: req.user!.userId }
      });
      if (!merchant) throw new AppError(404, 'Merchant not found', 'MERCHANT_NOT_FOUND');

      const offers = await prisma.offer.findMany({
        where: { merchantId: merchant.id },
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
      const merchant = await prisma.merchantProfile.findUnique({
        where: { userId: req.user!.userId }
      });
      if (!merchant) throw new AppError(404, 'Merchant not found', 'MERCHANT_NOT_FOUND');

      const offer = await prisma.offer.findFirst({ where: { id, merchantId: merchant.id } });
      if (!offer) throw new AppError(404, 'Offer not found', 'OFFER_NOT_FOUND');

      const updated = await prisma.offer.update({
        where: { id },
        data: {
          status: req.body.status || offer.status,
          title: req.body.title || offer.title,
          description: req.body.description || offer.description
        }
      });

      res.json({ success: true, data: { offer: updated } });
    } catch (error) {
      next(error);
    }
  },

  async deleteOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const merchant = await prisma.merchantProfile.findUnique({
        where: { userId: req.user!.userId }
      });
      if (!merchant) throw new AppError(404, 'Merchant not found', 'MERCHANT_NOT_FOUND');

      await prisma.offer.deleteMany({ where: { id, merchantId: merchant.id } });
      res.json({ success: true, message: 'Offer deleted' });
    } catch (error) {
      next(error);
    }
  },

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const merchant = await prisma.merchantProfile.findUnique({
        where: { userId: req.user!.userId }
      });
      if (!merchant) throw new AppError(404, 'Merchant not found', 'MERCHANT_NOT_FOUND');

      // 6-month sales trend
      const monthlySales = await Promise.all(
        Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const start = new Date(d.getFullYear(), d.getMonth(), 1);
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          return prisma.transaction.aggregate({
            where: { merchantId: merchant.id, status: 'COMPLETED', createdAt: { gte: start, lte: end } },
            _sum: { amount: true },
            _count: true
          }).then(r => ({
            month: start.toLocaleString('default', { month: 'short' }),
            sales: r._sum.amount || 0,
            transactions: r._count
          }));
        })
      );

      const offerPerformance = await prisma.offer.findMany({
        where: { merchantId: merchant.id },
        include: { _count: { select: { redemptions: true } } },
        orderBy: { usedCount: 'desc' }
      });

      res.json({
        success: true,
        data: {
          monthlySales: monthlySales.reverse(),
          offerPerformance
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
