import { prisma } from '../config/database';
import { generateCouponCode, calculateLevel } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';
import { notificationService } from './notificationService';

export const rewardService = {
  async awardPoints(studentId: string, points: number, transactionId?: string, description = 'Points earned') {
    await prisma.rewardLedger.create({
      data: {
        studentId,
        points,
        description,
        ...(transactionId ? { transactionId } : {})
      }
    });

    // Update student's total points
    await prisma.studentProfile.update({
      where: { id: studentId },
      data: { totalPoints: { increment: points } }
    });

    return points;
  },

  async redeemReward(studentId: string, rewardId: string, userId: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId }
    });
    if (!student) throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');

    const reward = await prisma.reward.findUnique({
      where: { id: rewardId }
    });
    if (!reward || !reward.isActive) {
      throw new AppError(404, 'Reward not found or inactive', 'REWARD_NOT_FOUND');
    }
    if (student.totalPoints < reward.pointsCost) {
      throw new AppError(400, 'Insufficient Loop Points', 'INSUFFICIENT_POINTS');
    }
    if (reward.totalStock !== null && reward.usedCount >= reward.totalStock) {
      throw new AppError(400, 'Reward is out of stock', 'REWARD_OUT_OF_STOCK');
    }

    // Deduct points and create coupon atomically
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const couponCode = generateCouponCode('PL');

    const [coupon] = await prisma.$transaction([
      prisma.coupon.create({
        data: {
          code: couponCode,
          studentId,
          rewardId,
          value: reward.value || 0,
          description: reward.description,
          expiresAt
        }
      }),
      prisma.rewardLedger.create({
        data: {
          studentId,
          points: -reward.pointsCost,
          description: `Redeemed: ${reward.title}`,
          rewardId
        }
      }),
      prisma.studentProfile.update({
        where: { id: studentId },
        data: {
          totalPoints: { decrement: reward.pointsCost }
        }
      }),
      prisma.reward.update({
        where: { id: rewardId },
        data: { usedCount: { increment: 1 } }
      })
    ]);

    // Send notification
    await notificationService.create({
      userId,
      type: 'REWARD',
      title: '🎁 Reward Unlocked!',
      message: `Your coupon code is ${couponCode}. Valid for 30 days!`,
      metadata: { couponCode, rewardTitle: reward.title }
    });

    return { coupon, reward };
  },

  async getStudentRewards(studentId: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { totalPoints: true }
    });

    const levelInfo = calculateLevel(student?.totalPoints || 0);
    const rewards = await prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { pointsCost: 'asc' }
    });

    const ledger = await prisma.rewardLedger.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const coupons = await prisma.coupon.findMany({
      where: { studentId, isUsed: false, expiresAt: { gt: new Date() } },
      include: { reward: true },
      orderBy: { createdAt: 'desc' }
    });

    return {
      totalPoints: student?.totalPoints || 0,
      levelInfo,
      rewards,
      ledger,
      activeCoupons: coupons
    };
  }
};
