import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { createBillSchema } from '../validators/app.validator';

export const billController = {
  async createBill(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createBillSchema.parse(req.body);
      const userId = req.user!.userId;

      // Calculate amounts for each participant
      let participants = data.participants;

      if (data.splitType === 'EQUAL') {
        const perPerson = parseFloat((data.total / (participants.length + 1)).toFixed(2));
        participants = participants.map(p => ({ ...p, amount: perPerson }));
      } else if (data.splitType === 'PERCENTAGE') {
        participants = participants.map(p => ({
          ...p,
          amount: parseFloat(((data.total * (p.percentage || 0)) / 100).toFixed(2))
        }));
      }

      const bill = await prisma.bill.create({
        data: {
          title: data.title,
          total: data.total,
          creatorId: userId,
          splitType: data.splitType,
          notes: data.notes,
          participants: {
            create: participants.map(p => ({
              userId: p.userId,
              amount: p.amount || 0
            }))
          }
        },
        include: {
          participants: { include: { user: true } },
          creator: true
        }
      });

      // Log
      await prisma.auditLog.create({
        data: { userId, action: 'BILL_CREATED', metadata: { billId: bill.id, total: data.total } }
      });

      res.status(201).json({ success: true, data: { bill } });
    } catch (error) {
      next(error);
    }
  },

  async getBill(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const bill = await prisma.bill.findFirst({
        where: {
          id,
          OR: [
            { creatorId: userId },
            { participants: { some: { userId } } }
          ]
        },
        include: {
          creator: true,
          participants: { include: { user: true } }
        }
      });

      if (!bill) throw new AppError(404, 'Bill not found', 'BILL_NOT_FOUND');

      res.json({ success: true, data: { bill } });
    } catch (error) {
      next(error);
    }
  },

  async getBills(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const bills = await prisma.bill.findMany({
        where: {
          OR: [
            { creatorId: userId },
            { participants: { some: { userId } } }
          ]
        },
        include: {
          creator: true,
          participants: { include: { user: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: { bills } });
    } catch (error) {
      next(error);
    }
  },

  async markParticipantPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      // Only creator or participant can mark paid
      const participant = await prisma.billParticipant.findFirst({
        where: { billId: id, userId }
      });

      if (!participant) throw new AppError(403, 'You are not a participant in this bill', 'FORBIDDEN');

      await prisma.billParticipant.update({
        where: { id: participant.id },
        data: { isPaid: true, paidAt: new Date() }
      });

      // Check if all paid
      const allParticipants = await prisma.billParticipant.findMany({
        where: { billId: id }
      });
      const allPaid = allParticipants.every(p => p.isPaid);

      if (allPaid) {
        await prisma.bill.update({
          where: { id },
          data: { status: 'SETTLED' }
        });
      } else {
        const anyPaid = allParticipants.some(p => p.isPaid);
        if (anyPaid) {
          await prisma.bill.update({ where: { id }, data: { status: 'PARTIALLY_PAID' } });
        }
      }

      res.json({ success: true, message: 'Marked as paid', data: { allSettled: allPaid } });
    } catch (error) {
      next(error);
    }
  }
};
