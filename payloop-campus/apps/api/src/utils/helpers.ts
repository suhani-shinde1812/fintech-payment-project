import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique PayLoop transaction reference
 * Format: PL-DEMO-XXXXXXXX (8 hex chars)
 */
export function generateTransactionRef(): string {
  const hex = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  return `PL-DEMO-${hex}`;
}

/**
 * Generates a unique coupon code
 * Format: PL-CAFE-XXXX (for merchant-specific) or PL-XXXX (generic)
 */
export function generateCouponCode(prefix = 'PL'): string {
  const hex = uuidv4().replace(/-/g, '').substring(0, 6).toUpperCase();
  return `${prefix}-${hex}`;
}

/**
 * Generates a unique QR merchant identifier
 */
export function generateMerchantQrId(): string {
  return `PLM-${uuidv4().substring(0, 8).toUpperCase()}`;
}

/**
 * Calculates Loop Points for a given spending amount
 * ₹100 = 5 points (0.05 points per rupee)
 */
export function calculatePoints(amount: number, multiplier = 1): number {
  return Math.floor(amount * 0.05 * multiplier);
}

/**
 * Calculates user level based on total points
 */
export function calculateLevel(totalPoints: number): { level: number; name: string; nextLevelPoints: number } {
  const levels = [
    { level: 1, name: 'Newbie', minPoints: 0, maxPoints: 499 },
    { level: 2, name: 'Regular', minPoints: 500, maxPoints: 1499 },
    { level: 3, name: 'Smart Saver', minPoints: 1500, maxPoints: 2999 },
    { level: 4, name: 'Local VIP', minPoints: 3000, maxPoints: 5999 },
    { level: 5, name: 'PayLoop Pro', minPoints: 6000, maxPoints: Infinity },
  ];

  const current = levels.find(l => totalPoints >= l.minPoints && totalPoints <= l.maxPoints) || levels[0];
  const nextLevel = levels.find(l => l.level === current.level + 1);

  return {
    level: current.level,
    name: current.name,
    nextLevelPoints: nextLevel ? nextLevel.minPoints - totalPoints : 0
  };
}

/**
 * Calculates discount amount for an offer
 */
export function calculateDiscount(
  amount: number,
  discountType: 'PERCENTAGE' | 'FLAT',
  discountValue: number,
  maxDiscount?: number
): number {
  let discount = 0;
  if (discountType === 'PERCENTAGE') {
    discount = (amount * discountValue) / 100;
  } else {
    discount = discountValue;
  }
  if (maxDiscount) {
    discount = Math.min(discount, maxDiscount);
  }
  return Math.min(discount, amount); // Can't discount more than the amount
}

/**
 * Safe pagination helper
 */
export function getPagination(page?: string | number, limit?: string | number) {
  const p = Math.max(1, parseInt(String(page || 1), 10));
  const l = Math.min(100, Math.max(1, parseInt(String(limit || 20), 10)));
  return {
    skip: (p - 1) * l,
    take: l,
    page: p,
    limit: l
  };
}

/**
 * Format currency in INR
 */
export function formatINR(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}
