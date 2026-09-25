// ── Enums ──────────────────────────────────────────────────────────────────────
export type Role = 'STUDENT' | 'MERCHANT' | 'ADMIN';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type RewardType = 'POINTS' | 'DISCOUNT' | 'CASHBACK_SIMULATION' | 'COUPON' | 'FREE_ITEM';
export type OfferStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'PENDING_APPROVAL' | 'REJECTED';
export type MerchantStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED';
export type BillStatus = 'OPEN' | 'PARTIALLY_PAID' | 'SETTLED';
export type SplitType = 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
export type NotificationType = 'PAYMENT' | 'REWARD' | 'OFFER' | 'SYSTEM' | 'ALERT';
export type GoalType = 'LAPTOP' | 'PHONE' | 'TRIP' | 'EMERGENCY_FUND' | 'COLLEGE_FEES' | 'CUSTOM';

// ── Models ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  studentProfile?: StudentProfile;
  merchantProfile?: MerchantProfile;
}

export interface StudentProfile {
  id: string;
  userId: string;
  college: string;
  course: string;
  year: number;
  demoBalance: number;
  totalPoints: number;
  level: number;
}

export interface MerchantProfile {
  id: string;
  userId: string;
  businessName: string;
  description?: string;
  categoryId: string;
  address: string;
  phone: string;
  website?: string;
  logoUrl?: string;
  qrCode?: string;
  status: MerchantStatus;
  totalSales: number;
  category?: MerchantCategory;
}

export interface MerchantCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface Transaction {
  id: string;
  transactionRef: string;
  studentId: string;
  merchantId: string;
  amount: number;
  status: TransactionStatus;
  pointsEarned: number;
  offerId?: string;
  notes?: string;
  createdAt: string;
  merchant?: MerchantProfile;
  offer?: Offer;
  payment?: Payment;
}

export interface Payment {
  id: string;
  transactionId: string;
  senderId: string;
  amount: number;
  status: TransactionStatus;
  providerRef?: string;
  providerName: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  type: RewardType;
  pointsCost: number;
  value?: number;
  merchantId?: string;
  isActive: boolean;
  totalStock?: number;
  usedCount: number;
  imageUrl?: string;
}

export interface RewardLedger {
  id: string;
  studentId: string;
  points: number;
  description: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  value: number;
  description: string;
  isUsed: boolean;
  expiresAt: string;
  reward?: Reward;
}

export interface Offer {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minSpend: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  status: OfferStatus;
  isStudentOnly: boolean;
  merchant?: MerchantProfile;
  category?: MerchantCategory;
}

export interface Bill {
  id: string;
  title: string;
  total: number;
  creatorId: string;
  splitType: SplitType;
  status: BillStatus;
  notes?: string;
  createdAt: string;
  creator?: User;
  participants: BillParticipant[];
}

export interface BillParticipant {
  id: string;
  billId: string;
  userId: string;
  amount: number;
  isPaid: boolean;
  paidAt?: string;
  user?: User;
}

export interface Expense {
  id: string;
  studentId: string;
  amount: number;
  category: string;
  description: string;
  merchantName?: string;
  date: string;
}

export interface SavingsGoal {
  id: string;
  studentId: string;
  title: string;
  goalType: GoalType;
  target: number;
  current: number;
  deadline?: string;
  isCompleted: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface LevelInfo {
  level: number;
  name: string;
  nextLevelPoints: number;
}

// ── API Response Types ─────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data?: T;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ── Dashboard Types ─────────────────────────────────────────────────────────────
export interface StudentDashboard {
  student: {
    name: string;
    email: string;
    avatarUrl?: string;
    demoBalance: number;
    totalPoints: number;
    level: LevelInfo;
  };
  stats: {
    monthlySpend: number;
    savedThisMonth: number;
    unreadNotifications: number;
  };
  recentTransactions: Transaction[];
  activeOffers: Offer[];
}

export interface MerchantDashboard {
  merchant: MerchantProfile;
  stats: {
    today: { sales: number; transactions: number };
    month: { sales: number; transactions: number };
    totalCustomers: number;
    totalSales: number;
  };
  recentTransactions: Transaction[];
  activeOffers: Offer[];
  dailySales: Array<{ date: string; sales: number; transactions: number }>;
}

// ── Payment Types ───────────────────────────────────────────────────────────────
export interface PaymentResult {
  transaction: Transaction;
  payment: { providerRef: string; providerName: string };
  pointsEarned: number;
  appliedDiscount: number;
  finalAmount: number;
  isDemo: boolean;
  merchant: { name: string };
  demoWarning: string;
}
