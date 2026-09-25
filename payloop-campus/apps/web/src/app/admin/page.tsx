'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { formatINR, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminStats {
  totalStudents: number;
  totalMerchants: number;
  totalTransactions: number;
  totalOffers: number;
  totalPointsEarned: number;
  pendingMerchants: number;
  activeUsers: number;
}
interface Transaction {
  id: string; amount: number; createdAt: string; status: string;
  student: { user: { name: string } };
  merchant: { businessName: string };
}
interface DashboardData { stats: AdminStats; recentTransactions: Transaction[]; }

interface Merchant {
  id: string; businessName: string; status: string; totalSales: number; createdAt: string;
  user: { name: string; email: string; isActive: boolean };
  category?: { name: string; icon: string };
}
interface User {
  id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string;
  studentProfile?: { totalPoints: number; demoBalance: number; level: number };
  merchantProfile?: { businessName: string; status: string };
}
interface Offer {
  id: string; title: string; discountType: string; discountValue: number;
  status: string; usedCount: number; createdAt: string;
  merchant: { businessName: string };
}

type Tab = 'overview' | 'merchants' | 'users' | 'offers';

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="pl-card p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2 ${color}`}>{icon}</div>
      <div className="text-xl font-black gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-indigo-600 font-semibold mt-1">{sub}</div>}
    </div>
  );
}

const MERCHANT_STATUS_COLORS: Record<string, string> = {
  APPROVED: 'pl-badge-success',
  PENDING: 'pl-badge-warning',
  SUSPENDED: 'pl-badge-danger',
};
const OFFER_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'pl-badge-success',
  PENDING_APPROVAL: 'pl-badge-warning',
  PAUSED: 'bg-gray-100 text-gray-500',
  EXPIRED: 'bg-gray-100 text-gray-400',
  REJECTED: 'pl-badge-danger',
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('overview');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [merchantFilter, setMerchantFilter] = useState('');
  const [offerFilter, setOfferFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (!authLoading && user && user.role !== 'ADMIN') {
      if (user.role === 'STUDENT') router.push('/student/dashboard');
      else router.push('/merchant/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    Promise.all([
      api.admin.dashboard().then(d => setDashboard(d as DashboardData)),
      api.admin.merchants().then(d => setMerchants((d as { merchants: Merchant[] }).merchants || [])),
      api.admin.users().then(d => setUsers((d as { users: User[] }).users || [])),
      api.admin.offers().then(d => setOffers((d as { offers: Offer[] }).offers || [])),
    ])
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [user]);

  const handleApproveMerchant = async (id: string, status: string) => {
    setActionLoading(id + status);
    try {
      await api.admin.approveMerchant(id, status);
      setMerchants(ms => ms.map(m => m.id === id ? { ...m, status } : m));
      toast.success(`Merchant ${status.toLowerCase()}`);
    } catch { toast.error('Action failed'); }
    finally { setActionLoading(null); }
  };

  const handleSuspendUser = async (id: string, isActive: boolean) => {
    setActionLoading(id);
    try {
      await api.admin.suspendUser(id, isActive);
      setUsers(us => us.map(u => u.id === id ? { ...u, isActive } : u));
      toast.success(isActive ? 'User reactivated' : 'User suspended');
    } catch { toast.error('Action failed'); }
    finally { setActionLoading(null); }
  };

  const handleOfferAction = async (id: string, status: string) => {
    setActionLoading(id + status);
    try {
      await api.admin.updateOffer(id, status);
      setOffers(os => os.map(o => o.id === id ? { ...o, status } : o));
      toast.success(`Offer ${status.toLowerCase().replace('_', ' ')}`);
    } catch { toast.error('Action failed'); }
    finally { setActionLoading(null); }
  };

  if (authLoading || !user || user.role !== 'ADMIN') {
    return <div className="min-h-screen flex items-center justify-center"><div className="pl-skeleton w-12 h-12 rounded-2xl" /></div>;
  }

  const filteredMerchants = merchants.filter(m =>
    !merchantFilter || m.status === merchantFilter
  );
  const filteredOffers = offers.filter(o =>
    !offerFilter || o.status === offerFilter
  );
  const filteredUsers = users.filter(u =>
    !userFilter || u.role === userFilter
  );

  const tabs: { key: Tab; icon: string; label: string; badge?: number }[] = [
    { key: 'overview', icon: '📊', label: 'Overview' },
    { key: 'merchants', icon: '🏪', label: 'Merchants', badge: dashboard?.stats.pendingMerchants },
    { key: 'users', icon: '👥', label: 'Users' },
    { key: 'offers', icon: '🎯', label: 'Offers' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b" style={{ borderColor: 'var(--card-border)' }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <span className="text-white font-black text-xs">PL</span>
            </div>
            <span className="font-black text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>PayLoop Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <button
              onClick={() => { localStorage.removeItem('pl_token'); window.location.href = '/login'; }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Demo banner */}
        <div className="px-4 py-1.5 text-center text-xs font-bold text-white"
          style={{ background: 'linear-gradient(90deg, #ef4444, #f97316)' }}>
          ⚠️ ADMIN PORTAL · All data is demo/sandbox
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon} {t.label}
              {t.badge ? (
                <span className="ml-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-black">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* ── OVERVIEW ──────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-5 animate-fadeInUp">
            <div>
              <h1 className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Platform Overview</h1>
              <p className="text-sm text-gray-500 mt-1">Hello, {user.name} 👋 — Here&apos;s the latest snapshot</p>
            </div>

            {loadingData ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1,2,3,4,5,6,7].map(i => <div key={i} className="pl-skeleton h-24 rounded-2xl" />)}
              </div>
            ) : dashboard ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon="🎓" label="Students" value={dashboard.stats.totalStudents.toLocaleString()} color="bg-blue-50" />
                  <StatCard icon="🏪" label="Merchants" value={dashboard.stats.totalMerchants.toLocaleString()} color="bg-purple-50" />
                  <StatCard icon="💳" label="Transactions" value={dashboard.stats.totalTransactions.toLocaleString()} color="bg-green-50" />
                  <StatCard icon="🎯" label="Active Offers" value={dashboard.stats.totalOffers.toLocaleString()} color="bg-orange-50" />
                  <StatCard icon="⭐" label="Points Issued" value={dashboard.stats.totalPointsEarned.toLocaleString()} color="bg-yellow-50" />
                  <StatCard icon="⏳" label="Pending Approval" value={dashboard.stats.pendingMerchants} sub="merchants" color="bg-red-50" />
                  <StatCard icon="👤" label="Active (7d)" value={dashboard.stats.activeUsers} sub="logged in recently" color="bg-indigo-50" />
                </div>

                <div>
                  <h2 className="font-bold text-base mb-3">Recent Transactions</h2>
                  <div className="pl-card p-0 divide-y">
                    {dashboard.recentTransactions.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">No transactions yet</div>
                    ) : dashboard.recentTransactions.map(tx => (
                      <div key={tx.id} className="tx-item px-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'var(--muted)' }}>
                          💳
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">
                            {tx.student.user.name} → {tx.merchant.businessName}
                          </div>
                          <div className="text-xs text-gray-400">{formatDateTime(tx.createdAt)}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-sm text-green-600">{formatINR(tx.amount)}</div>
                          <span className={`text-xs pl-badge ${tx.status === 'COMPLETED' ? 'pl-badge-success' : 'pl-badge-warning'}`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ── MERCHANTS ─────────────────────────────────────────────── */}
        {tab === 'merchants' && (
          <div className="space-y-4 animate-fadeInUp">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Merchants 🏪</h1>
                <p className="text-sm text-gray-500">{merchants.length} total merchants</p>
              </div>
              <select className="pl-input w-auto text-sm py-2" value={merchantFilter} onChange={e => setMerchantFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            {loadingData ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="pl-skeleton h-36 rounded-2xl" />)}</div>
            ) : filteredMerchants.length === 0 ? (
              <div className="pl-card text-center py-12">
                <div className="text-4xl mb-3">🏪</div>
                <p className="text-gray-500">No merchants found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMerchants.map(merchant => (
                  <div key={merchant.id} className="pl-card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ background: 'var(--muted)' }}>
                          {merchant.category?.icon || '🏪'}
                        </div>
                        <div>
                          <div className="font-bold">{merchant.businessName}</div>
                          <div className="text-xs text-gray-500">{merchant.user.name} · {merchant.user.email}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{merchant.category?.name}</div>
                        </div>
                      </div>
                      <span className={`pl-badge ${MERCHANT_STATUS_COLORS[merchant.status] || 'bg-gray-100 text-gray-500'} text-xs`}>
                        {merchant.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-gray-50 rounded-xl p-2 text-center">
                        <div className="font-bold text-sm">{formatINR(merchant.totalSales)}</div>
                        <div className="text-xs text-gray-500">Total Sales</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2 text-center">
                        <div className="font-bold text-sm">{new Date(merchant.createdAt).toLocaleDateString('en-IN')}</div>
                        <div className="text-xs text-gray-500">Joined</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {merchant.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleApproveMerchant(merchant.id, 'APPROVED')}
                          disabled={actionLoading === merchant.id + 'APPROVED'}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                        >
                          {actionLoading === merchant.id + 'APPROVED' ? '...' : '✅ Approve'}
                        </button>
                      )}
                      {merchant.status !== 'SUSPENDED' && (
                        <button
                          onClick={() => handleApproveMerchant(merchant.id, 'SUSPENDED')}
                          disabled={actionLoading === merchant.id + 'SUSPENDED'}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          {actionLoading === merchant.id + 'SUSPENDED' ? '...' : '🚫 Suspend'}
                        </button>
                      )}
                      {merchant.status === 'SUSPENDED' && (
                        <button
                          onClick={() => handleApproveMerchant(merchant.id, 'PENDING')}
                          disabled={actionLoading === merchant.id + 'PENDING'}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          {actionLoading === merchant.id + 'PENDING' ? '...' : '🔄 Reset to Pending'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── USERS ─────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div className="space-y-4 animate-fadeInUp">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Users 👥</h1>
                <p className="text-sm text-gray-500">{users.length} registered users</p>
              </div>
              <select className="pl-input w-auto text-sm py-2" value={userFilter} onChange={e => setUserFilter(e.target.value)}>
                <option value="">All Roles</option>
                <option value="STUDENT">Students</option>
                <option value="MERCHANT">Merchants</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>

            {loadingData ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="pl-skeleton h-24 rounded-2xl" />)}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="pl-card text-center py-12">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="pl-card p-0 divide-y">
                {filteredUsers.map(u => (
                  <div key={u.id} className="px-4 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                        {u.name}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                          u.role === 'MERCHANT' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{u.role}</span>
                        {!u.isActive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600">SUSPENDED</span>}
                      </div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                      {u.studentProfile && (
                        <div className="text-xs text-indigo-600 mt-0.5">
                          Lvl {u.studentProfile.level} · {u.studentProfile.totalPoints} pts · {formatINR(u.studentProfile.demoBalance)}
                        </div>
                      )}
                    </div>
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleSuspendUser(u.id, !u.isActive)}
                        disabled={actionLoading === u.id}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          u.isActive
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {actionLoading === u.id ? '...' : u.isActive ? 'Suspend' : 'Restore'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── OFFERS ────────────────────────────────────────────────── */}
        {tab === 'offers' && (
          <div className="space-y-4 animate-fadeInUp">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Offers 🎯</h1>
                <p className="text-sm text-gray-500">{offers.length} total offers</p>
              </div>
              <select className="pl-input w-auto text-sm py-2" value={offerFilter} onChange={e => setOfferFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="EXPIRED">Expired</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {loadingData ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="pl-skeleton h-28 rounded-2xl" />)}</div>
            ) : filteredOffers.length === 0 ? (
              <div className="pl-card text-center py-12">
                <div className="text-4xl mb-3">🎯</div>
                <p className="text-gray-500">No offers found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOffers.map(offer => (
                  <div key={offer.id} className="pl-card">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{offer.title}</div>
                        <div className="text-xs text-gray-500">{offer.merchant.businessName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {offer.discountType === 'FLAT' ? `₹${offer.discountValue} OFF` : `${offer.discountValue}% OFF`}
                          {' · '}Used {offer.usedCount} times
                          {' · '}{new Date(offer.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <span className={`pl-badge ${OFFER_STATUS_COLORS[offer.status] || 'bg-gray-100 text-gray-500'} text-xs ml-2 flex-shrink-0`}>
                        {offer.status.replace('_', ' ')}
                      </span>
                    </div>
                    {(offer.status === 'PENDING_APPROVAL' || offer.status === 'ACTIVE' || offer.status === 'PAUSED') && (
                      <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--card-border)' }}>
                        {offer.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => handleOfferAction(offer.id, 'ACTIVE')}
                              disabled={actionLoading === offer.id + 'ACTIVE'}
                              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                            >
                              {actionLoading === offer.id + 'ACTIVE' ? '...' : '✅ Approve'}
                            </button>
                            <button
                              onClick={() => handleOfferAction(offer.id, 'REJECTED')}
                              disabled={actionLoading === offer.id + 'REJECTED'}
                              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                              {actionLoading === offer.id + 'REJECTED' ? '...' : '❌ Reject'}
                            </button>
                          </>
                        )}
                        {offer.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleOfferAction(offer.id, 'PAUSED')}
                            disabled={actionLoading === offer.id + 'PAUSED'}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                          >
                            {actionLoading === offer.id + 'PAUSED' ? '...' : '⏸️ Pause'}
                          </button>
                        )}
                        {offer.status === 'PAUSED' && (
                          <button
                            onClick={() => handleOfferAction(offer.id, 'ACTIVE')}
                            disabled={actionLoading === offer.id + 'ACTIVE'}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                          >
                            {actionLoading === offer.id + 'ACTIVE' ? '...' : '▶️ Resume'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
