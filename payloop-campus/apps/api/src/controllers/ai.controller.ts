import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import axios from 'axios';
import { config } from '../config/env';

export const aiController = {
  async getInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const student = await prisma.studentProfile.findUnique({
        where: { userId },
        include: { user: true }
      });
      if (!student) throw new AppError(403, 'Only students can access AI insights', 'FORBIDDEN');

      // Get expense data for AI
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const lastMonthStart = new Date(monthStart);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      const lastMonthEnd = new Date(monthStart);
      lastMonthEnd.setDate(0);

      const [currentExpenses, lastExpenses, categoryBreakdown] = await Promise.all([
        prisma.expense.aggregate({
          where: { studentId: student.id, date: { gte: monthStart } },
          _sum: { amount: true }, _count: true
        }),
        prisma.expense.aggregate({
          where: { studentId: student.id, date: { gte: lastMonthStart, lte: lastMonthEnd } },
          _sum: { amount: true }, _count: true
        }),
        prisma.expense.groupBy({
          by: ['category'],
          where: { studentId: student.id, date: { gte: monthStart } },
          _sum: { amount: true },
          _count: true
        })
      ]);

      const expenseData = {
        studentName: student.user.name,
        currentMonthTotal: currentExpenses._sum.amount || 0,
        lastMonthTotal: lastExpenses._sum.amount || 0,
        transactionCount: currentExpenses._count,
        categoryBreakdown: categoryBreakdown.map(c => ({
          category: c.category,
          amount: c._sum.amount || 0,
          count: c._count
        })),
        totalPoints: student.totalPoints,
        demoBalance: student.demoBalance
      };

      // Try AI service
      try {
        const aiResponse = await axios.post(`${config.aiServiceUrl}/insights`, expenseData, {
          timeout: 10000
        });

        // Save insight
        const insight = await prisma.aIInsight.create({
          data: {
            userId,
            type: 'SPENDING',
            title: aiResponse.data.title || 'Your Spending Insight',
            content: aiResponse.data.content,
            metadata: aiResponse.data
          }
        });

        await prisma.auditLog.create({
          data: { userId, action: 'AI_INSIGHT_VIEWED', metadata: { insightId: insight.id } }
        });

        return res.json({ success: true, data: { insight: aiResponse.data, raw: expenseData } });
      } catch (_aiError) {
        // Fallback mock insight
        const mockInsight = generateMockInsight(expenseData);
        return res.json({ success: true, data: { insight: mockInsight, raw: expenseData, isMock: true } });
      }
    } catch (error) {
      next(error);
    }
  },

  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { message } = req.body;
      if (!message) throw new AppError(400, 'Message is required', 'MISSING_MESSAGE');

      const userId = req.user!.userId;
      const student = await prisma.studentProfile.findUnique({ where: { userId } });
      if (!student) throw new AppError(403, 'Only students can use AI chat', 'FORBIDDEN');

      // Get context data for the chat
      const monthStart = new Date();
      monthStart.setDate(1);

      const [expenses, transactions, points] = await Promise.all([
        prisma.expense.groupBy({
          by: ['category'],
          where: { studentId: student.id, date: { gte: monthStart } },
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          where: { studentId: student.id, status: 'COMPLETED', createdAt: { gte: monthStart } },
          _sum: { amount: true }, _count: true
        }),
        Promise.resolve(student.totalPoints)
      ]);

      const context = {
        message,
        studentData: {
          monthlyExpenses: expenses.map(e => ({ category: e.category, amount: e._sum.amount || 0 })),
          totalMonthlySpend: transactions._sum.amount || 0,
          transactionCount: transactions._count,
          totalPoints: points,
          demoBalance: student.demoBalance
        }
      };

      try {
        const aiResponse = await axios.post(`${config.aiServiceUrl}/chat`, context, { timeout: 10000 });
        return res.json({ success: true, data: { reply: aiResponse.data.reply } });
      } catch (_aiError) {
        const mockReply = generateMockChatReply(message, context.studentData);
        return res.json({ success: true, data: { reply: mockReply, isMock: true } });
      }
    } catch (error) {
      next(error);
    }
  },

  async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const student = await prisma.studentProfile.findUnique({ where: { userId } });
      if (!student) throw new AppError(403, 'Forbidden', 'FORBIDDEN');

      // Get student's top spending category
      const monthStart = new Date();
      monthStart.setDate(1);

      const topCategory = await prisma.expense.groupBy({
        by: ['category'],
        where: { studentId: student.id, date: { gte: monthStart } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 1
      });

      // Find offers in that category
      const categoryMap: Record<string, string> = {
        Food: 'Food & Dining',
        Shopping: 'Shopping',
        Entertainment: 'Entertainment',
        Travel: 'Travel',
        Education: 'Education'
      };

      const topCat = topCategory[0]?.category || 'Food';
      const mappedCat = categoryMap[topCat] || topCat;

      const recommendedOffers = await prisma.offer.findMany({
        where: {
          status: 'ACTIVE',
          endDate: { gt: new Date() },
          OR: [
            { category: { name: { contains: mappedCat, mode: 'insensitive' } } },
            { merchant: { category: { name: { contains: mappedCat, mode: 'insensitive' } } } }
          ]
        },
        include: { merchant: { include: { category: true } } },
        take: 6
      });

      // If no category-specific, return top offers
      const offers = recommendedOffers.length > 0
        ? recommendedOffers
        : await prisma.offer.findMany({
            where: { status: 'ACTIVE', endDate: { gt: new Date() } },
            include: { merchant: { include: { category: true } } },
            orderBy: { discountValue: 'desc' },
            take: 6
          });

      res.json({
        success: true,
        data: {
          topCategory: topCat,
          recommendations: offers,
          reason: `You often spend on ${topCat}. These offers match your spending pattern.`
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

// Mock AI responses for when AI service is unavailable
function generateMockInsight(data: {
  studentName: string;
  currentMonthTotal: number;
  lastMonthTotal: number;
  transactionCount: number;
  categoryBreakdown: Array<{ category: string; amount: number; count: number }>;
  totalPoints: number;
}) {
  const topCategory = data.categoryBreakdown.sort((a, b) => b.amount - a.amount)[0];
  const changePercent = data.lastMonthTotal > 0
    ? Math.round(((data.currentMonthTotal - data.lastMonthTotal) / data.lastMonthTotal) * 100)
    : 0;

  return {
    title: '✨ Your AI Spending Insight',
    content: `Hi ${data.studentName}! Here's your personalized spending summary:\n\n` +
      `You've spent ₹${data.currentMonthTotal.toFixed(0)} this month across ${data.transactionCount} transactions.\n\n` +
      (changePercent !== 0 ? `Your spending is ${Math.abs(changePercent)}% ${changePercent > 0 ? 'higher' : 'lower'} than last month.\n\n` : '') +
      (topCategory ? `Your largest spending category is ${topCategory.category} at ₹${topCategory.amount.toFixed(0)}.\n\n` : '') +
      `💡 Tip: Check out the student offers section to save on your next purchase!\n\n` +
      `⚠️ This is an educational summary based on your demo activity, not financial advice.`,
    suggestions: [
      'Browse student food offers to save on meals',
      `You have ${data.totalPoints} Loop Points — consider redeeming them!`,
      'Set a savings goal to track your progress'
    ],
    disclaimer: 'This insight is generated from demo activity data. Not financial advice.'
  };
}

function generateMockChatReply(
  message: string,
  data: { monthlyExpenses: Array<{ category: string; amount: number }>; totalMonthlySpend: number; transactionCount: number; totalPoints: number; demoBalance: number }
): string {
  const lower = message.toLowerCase();

  if (lower.includes('spend') || lower.includes('spent')) {
    const topCat = data.monthlyExpenses.sort((a, b) => b.amount - a.amount)[0];
    return `This month you've spent ₹${data.totalMonthlySpend.toFixed(0)} across ${data.transactionCount} transactions. ` +
      (topCat ? `Your biggest category is ${topCat.category} at ₹${topCat.amount.toFixed(0)}.` : '') +
      '\n\n⚠️ This is demo data. Not financial advice.';
  }
  if (lower.includes('point') || lower.includes('reward')) {
    return `You have ${data.totalPoints} Loop Points! You can redeem them in the Rewards section for coupons and discounts.`;
  }
  if (lower.includes('balance')) {
    return `Your demo balance is ₹${data.demoBalance.toFixed(0)}. Remember, this is a simulation — no real money is involved.`;
  }
  if (lower.includes('food') || lower.includes('cafe') || lower.includes('restaurant')) {
    const food = data.monthlyExpenses.find(e => e.category === 'Food');
    return food
      ? `You've spent ₹${food.amount.toFixed(0)} on food this month. Check out the student food offers to save on your next meal!`
      : `I don't see any food transactions this month yet. Check out our food offers!`;
  }
  if (lower.includes('save') || lower.includes('saving')) {
    return `Great question! You can save by:\n1. Using student offers (up to 20% off)\n2. Setting a savings goal in the Goals section\n3. Redeeming Loop Points for coupons\n\nRemember: This is demo advice, not financial advice.`;
  }

  return `I can help you understand your demo spending patterns! Try asking:\n• "Where did I spend the most?"\n• "How many points do I have?"\n• "What's my balance?"\n\nNote: All data is from demo activity only.`;
}
