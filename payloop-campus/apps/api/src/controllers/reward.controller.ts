import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { rewardService } from '../services/rewardService';

export const rewardController = {
  async getRewards(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user!.userId }
      });
      if (!student) throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');

      const data = await rewardService.getStudentRewards(student.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async redeemReward(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const student = await prisma.studentProfile.findUnique({ where: { userId } });
      if (!student) throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');

      const result = await rewardService.redeemReward(student.id, id, userId);

      // Log redemption
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'REWARD_REDEEMED',
          metadata: { rewardId: id, couponCode: result.coupon.code }
        }
      });

      res.json({
        success: true,
        message: '🎉 Reward unlocked!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};
