/**
 * PayLoop Payment Provider Abstraction
 *
 * This abstraction layer allows swapping the payment provider
 * without rewriting application code. In V1, only DemoPaymentProvider
 * is active — it simulates payments and DOES NOT move real money.
 *
 * To integrate a real UPI/payment provider in the future:
 * 1. Create a class implementing PaymentProvider
 * 2. Change the factory in PaymentService to return the new provider
 * 3. No application code changes required
 *
 * ⚠️  IMPORTANT: This is a DEMO system. No real money is moved.
 */

export interface PaymentCreateParams {
  amount: number;
  studentId: string;
  merchantId: string;
  offerId?: string;
  notes?: string;
}

export interface PaymentResult {
  success: boolean;
  providerRef: string;
  amount: number;
  providerName: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentStatus {
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  providerRef: string;
  timestamp: Date;
}

/**
 * Abstract payment provider interface.
 * All payment providers must implement this interface.
 */
export abstract class PaymentProvider {
  abstract readonly providerName: string;
  abstract readonly isDemo: boolean;

  abstract createPayment(params: PaymentCreateParams): Promise<PaymentResult>;
  abstract getPaymentStatus(providerRef: string): Promise<PaymentStatus>;
  abstract refundPayment(providerRef: string, amount: number): Promise<PaymentResult>;
}

/**
 * Demo Payment Provider — V1
 *
 * ⚠️  This provider simulates payment processing.
 * NO REAL MONEY IS MOVED. This is a demo/sandbox system.
 *
 * Future: Replace or extend with a regulated UPI/payment provider
 * by implementing the PaymentProvider interface above.
 */
export class DemoPaymentProvider extends PaymentProvider {
  readonly providerName = 'DEMO';
  readonly isDemo = true;

  async createPayment(params: PaymentCreateParams): Promise<PaymentResult> {
    // Simulate slight network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Demo: always succeeds (can be extended to simulate failures for testing)
    const providerRef = `DEMO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return {
      success: true,
      providerRef,
      amount: params.amount,
      providerName: this.providerName,
      metadata: {
        note: 'DEMO PAYMENT — NO REAL MONEY WAS MOVED',
        simulatedAt: new Date().toISOString(),
        studentId: params.studentId,
        merchantId: params.merchantId
      }
    };
  }

  async getPaymentStatus(providerRef: string): Promise<PaymentStatus> {
    // In demo mode, all payments are completed immediately
    return {
      status: 'COMPLETED',
      providerRef,
      timestamp: new Date()
    };
  }

  async refundPayment(providerRef: string, _amount: number): Promise<PaymentResult> {
    return {
      success: true,
      providerRef: `REFUND-${providerRef}`,
      amount: _amount,
      providerName: this.providerName,
      metadata: { note: 'DEMO REFUND — NO REAL MONEY WAS MOVED' }
    };
  }
}

/**
 * Factory function — returns the active payment provider.
 *
 * FUTURE INTEGRATION POINT:
 * To switch to a real provider, update this function:
 *
 * export function getPaymentProvider(): PaymentProvider {
 *   if (process.env.PAYMENT_PROVIDER === 'razorpay') {
 *     return new RazorpayProvider(process.env.RAZORPAY_KEY_ID!, process.env.RAZORPAY_KEY_SECRET!);
 *   }
 *   return new DemoPaymentProvider();
 * }
 */
export function getPaymentProvider(): PaymentProvider {
  // V1: Always use demo provider
  return new DemoPaymentProvider();
}
