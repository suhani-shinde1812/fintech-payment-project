import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { calculateLevel, getPagination } from '../utils/helpers';
import { paymentService } from '../services/paymentService';
import { rewardService } from '../services/rewardService';
import { createPaymentSchema, createSavingsGoalSchema, addExpenseSchema } from '../validators/app.validator';

export const studentController = {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const student = await prisma.studentProfile.findUnique({
        where: { userId },
        include: { user: true }
      });
      if (!student) throw new AppError(404, 'Student profile not found', 'STUDENT_NOT_FOUND');

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Get this month's date range
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const [recentTransactions, monthlyExpenses, activeOffers, unreadCount, levelInfo] = await Promise.all([
        prisma.transaction.findMany({
          where: { studentId: student.id, status: 'COMPLETED' },
          include: { merchant: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
        prisma.expense.aggregate({
          where: { studentId: student.id, date: { gte: monthStart } },
          _sum: { amount: true }
        }),
        prisma.offer.findMany({
          where: { status: 'ACTIVE', endDate: { gt: new Date() } },
          include: { merchant: true },
          orderBy: { createdAt: 'desc' },
          take: 6
        }),
        prisma.notification.count({
          where: { userId, isRead: false }
        }),
        Promise.resolve(calculateLevel(student.totalPoints))
      ]);

      const monthlySavings = monthlyExpenses._sum.amount || 0;

      res.json({
        success: true,
        data: {
          student: {
            name: student.user.name,
            email: student.user.email,
            avatarUrl: student.user.avatarUrl,
            demoBalance: student.demoBalance,
            totalPoints: student.totalPoints,
            level: levelInfo
          },
          stats: {
            monthlySpend: monthlySavings,
            savedThisMonth: Math.floor(monthlySavings * 0.08), // 8% simulated savings
            unreadNotifications: unreadCount
          },
          recentTransactions,
          activeOffers
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user!.userId }
      });
      if (!student) throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');

      const { skip, take, page, limit } = getPagination(req.query.page, req.query.limit);

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: { studentId: student.id },
          include: { merchant: true, offer: true, payment: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take
        }),
        prisma.transaction.count({ where: { studentId: student.id } })
      ]);

      res.json({
        success: true,
        data: { transactions, total, page, limit, pages: Math.ceil(total / limit) }
      });
    } catch (error) {
      next(error);
    }
  },

  async getExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user!.userId }
      });
      if (!student) throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [expenses, categoryBreakdown, monthlyTrend] = await Promise.all([
        prisma.expense.findMany({
          where: { studentId: student.id },
          orderBy: { date: 'desc' },
          take: 50
        }),
        prisma.expense.groupBy({
          by: ['category'],
          where: { studentId: student.id, date: { gte: monthStart } },
          _sum: { amount: true },
          _count: true
        }),
        // Last 6 months trend
        Promise.all(Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const start = new Date(d.getFullYear(), d.getMonth(), 1);
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          return prisma.expense.aggregate({
            where: { studentId: student.id, date: { gte: start, lte: end } },
            _sum: { amount: true }
          }).then(r => ({
            month: start.toLocaleString('default', { month: 'short' }),
            year: start.getFullYear(),
            total: r._sum.amount || 0
          }));
        }))
      ]);

      res.json({
        success: true,
        data: {
          expenses,
          categoryBreakdown: categoryBreakdown.map(c => ({
            category: c.category,
            total: c._sum.amount || 0,
            count: c._count
          })),
          monthlyTrend: monthlyTrend.reverse()
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getSavingsGoals(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user!.userId }
      });
      if (!student) throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');

      const goals = await prisma.savingsGoal.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: { goals } });
    } catch (error) {
      next(error);
    }
  },

  async createSavingsGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSavingsGoalSchema.parse(req.body);
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user!.userId }
      });
      if (!student) throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');

      const goal = await prisma.savingsGoal.create({
        data: {
          studentId: student.id,
          title: data.title,
          goalType: data.goalType,
          target: data.target,
          current: data.current,
          ...(data.deadline ? { deadline: new Date(data.deadline) } : {})
        }
      });

      res.status(201).json({ success: true, data: { goal } });
    } catch (error) {
      next(error);
    }
  },

  async updateSavingsGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { current } = req.body;
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user!.userId }
      });
      if (!student) throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');

      const goal = await prisma.savingsGoal.updateMany({
        where: { id, studentId: student.id },
        data: { current, isCompleted: current >= (await prisma.savingsGoal.findUnique({ where: { id } }))!.target }
      });

      res.json({ success: true, data: { updated: goal.count > 0 } });
    } catch (error) {
      next(error);
    }
  },

  async addExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const data = addExpenseSchema.parse(req.body);
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user!.userId }
      });
      if (!student) throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');

      const expense = await prisma.expense.create({
        data: {
          studentId: student.id,
          amount: data.amount,
          category: data.category,
          description: data.description,
          merchantName: data.merchantName,
          date: data.date ? new Date(data.date) : new Date()
        }
      });

      res.status(201).json({ success: true, data: { expense } });
    } catch (error) {
      next(error);
    }
  }
};
