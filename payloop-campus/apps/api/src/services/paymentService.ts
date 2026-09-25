import { prisma } from '../config/database';
import { getPaymentProvider } from './paymentProvider';
import { generateTransactionRef, calculatePoints } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';
import { rewardService } from './rewardService';
import { notificationService } from './notificationService';

export const paymentService = {
  async createPayment(params: {
    studentId: string;
    userId: string;
    merchantId: string;
    amount: number;
    offerId?: string;
    notes?: string;
  }) {
    const { studentId, userId, merchantId, amount, offerId, notes } = params;

    // Get student profile and check balance
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true }
    });

    if (!student) throw new AppError(404, 'Student profile not found', 'STUDENT_NOT_FOUND');
    if (student.demoBalance < amount) {
      throw new AppError(400, 'Insufficient demo balance', 'INSUFFICIENT_BALANCE');
    }

    // Get merchant
    const merchant = await prisma.merchantProfile.findUnique({
      where: { id: merchantId }
    });
    if (!merchant || merchant.status !== 'APPROVED') {
      throw new AppError(404, 'Merchant not found or not approved', 'MERCHANT_NOT_FOUND');
    }

    // Validate offer if provided
    let appliedDiscount = 0;
    let finalAmount = amount;
    if (offerId) {
      const offer = await prisma.offer.findUnique({ where: { id: offerId } });
      if (offer && offer.status === 'ACTIVE' && offer.merchantId === merchantId) {
        if (amount >= offer.minSpend) {
          if (offer.discountType === 'PERCENTAGE') {
            appliedDiscount = (amount * offer.discountValue) / 100;
            if (offer.maxDiscount) appliedDiscount = Math.min(appliedDiscount, offer.maxDiscount);
          } else {
            appliedDiscount = offer.discountValue;
          }
          finalAmount = Math.max(0, amount - appliedDiscount);
        }
      }
    }

    // Use payment provider abstraction
    const provider = getPaymentProvider();
    const providerResult = await provider.createPayment({
      amount: finalAmount,
      studentId,
      merchantId,
      offerId,
      notes
    });

    if (!providerResult.success) {
      throw new AppError(500, 'Payment processing failed', 'PAYMENT_FAILED');
    }

    const transactionRef = generateTransactionRef();
    const pointsEarned = calculatePoints(finalAmount);

    // Create transaction and payment atomically
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          transactionRef,
          studentId,
          merchantId,
          amount: finalAmount,
          status: 'COMPLETED',
          pointsEarned,
          offerId,
          notes
        }
      }),
      // Deduct from demo balance
      prisma.studentProfile.update({
        where: { id: studentId },
        data: {
          demoBalance: { decrement: finalAmount },
          totalPoints: { increment: pointsEarned }
        }
      }),
      // Update merchant stats
      prisma.merchantProfile.update({
        where: { id: merchantId },
        data: { totalSales: { increment: finalAmount } }
      })
    ]);

    // Create the payment record
    await prisma.payment.create({
      data: {
        transactionId: transaction.id,
        senderId: userId,
        amount: finalAmount,
        status: 'COMPLETED',
        providerRef: providerResult.providerRef,
        providerName: provider.providerName,
        metadata: providerResult.metadata as object
      }
    });

    // Create expense record
    await prisma.expense.create({
      data: {
        studentId,
        transactionId: transaction.id,
        amount: finalAmount,
        category: 'Food', // Default; AI categorizes later
        description: `Payment to ${merchant.businessName}`,
        merchantName: merchant.businessName,
        date: new Date()
      }
    });

    // Award points to reward ledger
    await rewardService.awardPoints(studentId, pointsEarned, transaction.id, 'Payment reward');

    // Track offer redemption
    if (offerId && appliedDiscount > 0) {
      await prisma.offerRedemption.create({
        data: { offerId, studentId, discount: appliedDiscount }
      });
      await prisma.offer.update({
        where: { id: offerId },
        data: { usedCount: { increment: 1 } }
      });
    }

    // Send notification
    await notificationService.create({
      userId,
      type: 'PAYMENT',
      title: '💳 Demo Payment Successful',
      message: `₹${finalAmount.toFixed(2)} paid to ${merchant.businessName}. You earned ${pointsEarned} Loop Points!`,
      metadata: { transactionId: transaction.id, points: pointsEarned }
    });

    return {
      transaction,
      payment: { providerRef: providerResult.providerRef, providerName: provider.providerName },
      pointsEarned,
      appliedDiscount,
      finalAmount,
      isDemo: provider.isDemo,
      merchant: { name: merchant.businessName }
    };
  },

  async getTransaction(transactionId: string, studentId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, studentId },
      include: {
        merchant: { include: { user: true } },
        payment: true,
        offer: true
      }
    });

    if (!transaction) throw new AppError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');
    return transaction;
  }
};
