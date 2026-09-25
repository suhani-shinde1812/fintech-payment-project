const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pl_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new ApiError(
      res.status,
      data.message || 'An error occurred',
      data.code,
      data.details
    );
  }

  return data.data as T;
}

// ── Auth ────────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (body: Record<string, unknown>) =>
      request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (email: string, password: string) =>
      request<{ user: unknown; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    me: () => request('/api/auth/me'),
    logout: () => request('/api/auth/logout', { method: 'POST' }),
  },

  // ── Student ────────────────────────────────────────────────────────────────
  student: {
    dashboard: () => request('/api/student/dashboard'),
    transactions: (page = 1) => request(`/api/student/transactions?page=${page}`),
    expenses: () => request('/api/student/expenses'),
    addExpense: (body: Record<string, unknown>) =>
      request('/api/student/expenses', { method: 'POST', body: JSON.stringify(body) }),
    savings: () => request('/api/student/savings'),
    createGoal: (body: Record<string, unknown>) =>
      request('/api/student/savings', { method: 'POST', body: JSON.stringify(body) }),
    updateGoal: (id: string, current: number) =>
      request(`/api/student/savings/${id}`, { method: 'PATCH', body: JSON.stringify({ current }) }),
  },

  // ── Payments ───────────────────────────────────────────────────────────────
  payments: {
    create: (body: Record<string, unknown>) =>
      request('/api/payments/create', { method: 'POST', body: JSON.stringify(body) }),
    get: (id: string) => request(`/api/payments/${id}`),
  },

  // ── Offers ─────────────────────────────────────────────────────────────────
  offers: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/api/offers${qs}`);
    },
    get: (id: string) => request(`/api/offers/${id}`),
  },

  // ── Merchants ──────────────────────────────────────────────────────────────
  merchants: {
    list: () => request('/api/merchants'),
    get: (id: string) => request(`/api/merchants/${id}`),
    dashboard: () => request('/api/merchants/dashboard'),
    qr: () => request('/api/merchants/qr'),
    analytics: () => request('/api/merchants/analytics'),
    offers: {
      list: () => request('/api/merchants/offers'),
      create: (body: Record<string, unknown>) =>
        request('/api/merchants/offers', { method: 'POST', body: JSON.stringify(body) }),
      update: (id: string, body: Record<string, unknown>) =>
        request(`/api/merchants/offers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      delete: (id: string) =>
        request(`/api/merchants/offers/${id}`, { method: 'DELETE' }),
    }
  },

  // ── Rewards ────────────────────────────────────────────────────────────────
  rewards: {
    list: () => request('/api/rewards'),
    redeem: (id: string) => request(`/api/rewards/${id}/redeem`, { method: 'POST' }),
  },

  // ── Bills ──────────────────────────────────────────────────────────────────
  bills: {
    list: () => request('/api/bills'),
    get: (id: string) => request(`/api/bills/${id}`),
    create: (body: Record<string, unknown>) =>
      request('/api/bills', { method: 'POST', body: JSON.stringify(body) }),
    pay: (id: string) => request(`/api/bills/${id}/pay`, { method: 'POST' }),
  },

  // ── AI ─────────────────────────────────────────────────────────────────────
  ai: {
    insights: () => request('/api/ai/insights', { method: 'POST' }),
    chat: (message: string) =>
      request('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
    recommendations: () => request('/api/ai/recommendations'),
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    list: () => request('/api/notifications'),
    unread: () => request('/api/notifications/unread'),
    markRead: (id: string) => request(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request('/api/notifications/read-all', { method: 'POST' }),
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  admin: {
    dashboard: () => request('/api/admin/dashboard'),
    users: (page = 1, role?: string) =>
      request(`/api/admin/users?page=${page}${role ? `&role=${role}` : ''}`),
    merchants: (page = 1, status?: string) =>
      request(`/api/admin/merchants?page=${page}${status ? `&status=${status}` : ''}`),
    transactions: (page = 1) => request(`/api/admin/transactions?page=${page}`),
    offers: (status?: string) =>
      request(`/api/admin/offers${status ? `?status=${status}` : ''}`),
    approveMerchant: (id: string, status: string) =>
      request(`/api/admin/merchants/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    suspendUser: (id: string, isActive: boolean) =>
      request(`/api/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
    updateOffer: (id: string, status: string) =>
      request(`/api/admin/offers/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    categories: () => request('/api/admin/categories'),
  }
};
