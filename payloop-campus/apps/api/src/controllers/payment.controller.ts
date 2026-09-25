import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { paymentService } from '../services/paymentService';
import { createPaymentSchema } from '../validators/app.validator';

export const paymentController = {
  async createPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createPaymentSchema.parse(req.body);
      const userId = req.user!.userId;

      const student = await prisma.studentProfile.findUnique({ where: { userId } });
      if (!student) throw new AppError(403, 'Only students can make payments', 'FORBIDDEN');

      const result = await paymentService.createPayment({
        studentId: student.id,
        userId,
        merchantId: data.merchantId,
        amount: data.amount,
        offerId: data.offerId,
        notes: data.notes
      });

      res.status(201).json({
        success: true,
        message: 'Demo payment processed successfully',
        data: {
          ...result,
          demoWarning: '⚠️ DEMO PAYMENT — NO REAL MONEY WAS MOVED'
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const student = await prisma.studentProfile.findUnique({ where: { userId } });
      if (!student) throw new AppError(403, 'Only students can view payments', 'FORBIDDEN');

      const transaction = await paymentService.getTransaction(id, student.id);

      res.json({
        success: true,
        data: { transaction, demoWarning: '⚠️ DEMO PAYMENT — NO REAL MONEY WAS MOVED' }
      });
    } catch (error) {
      next(error);
    }
  }
};
