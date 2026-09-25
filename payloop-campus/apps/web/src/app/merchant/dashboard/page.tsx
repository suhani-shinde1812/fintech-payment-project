'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR, formatDateTime } from '@/lib/utils';

interface DailySale { date: string; sales: number; transactions: number; }
interface Transaction {
  id: string; transactionRef: string; amount: number; createdAt: string;
  student: { user: { name: string; email: string } };
}
interface Offer { id: string; title: string; discountType: string; discountValue: number; status: string; usedCount: number; }
interface Merchant { businessName: string; category?: { name: string; icon: string }; status: string; totalSales: number; }

interface DashboardData {
  merchant: Merchant;
  stats: {
    today: { sales: number; transactions: number };
    month: { sales: number; transactions: number };
    totalCustomers: number;
    totalSales: number;
  };
  recentTransactions: Transaction[];
  activeOffers: Offer[];
  dailySales: DailySale[];
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="pl-skeleton h-36 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="pl-skeleton h-24 rounded-xl" />
        <div className="pl-skeleton h-24 rounded-xl" />
      </div>
      <div className="pl-skeleton h-48 rounded-xl" />
      <div className="pl-skeleton h-56 rounded-xl" />
    </div>
  );
}

export default function MerchantDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.merchants.dashboard()
      .then(d => setData(d as DashboardData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  if (!data) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">😔</div>
        <p className="text-gray-500">Could not load dashboard. Please refresh.</p>
        <button onClick={() => window.location.reload()} className="pl-btn-primary mt-4">Retry</button>
      </div>
    );
  }

  const { merchant, stats, recentTransactions, activeOffers, dailySales } = data;
  const maxSales = Math.max(...dailySales.map(d => d.sales), 1);

  return (
    <div className="space-y-5 animate-fadeInUp">
      {/* Hero stats card */}
      <div className="pl-gradient-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/10 translate-y-8 -translate-x-8" />
        <div className="relative">
          <p className="text-white/70 text-sm mb-1">Welcome back 👋</p>
          <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {merchant.businessName}
          </h1>
          <p className="text-white/60 text-xs mb-4">{merchant.category?.icon} {merchant.category?.name}</p>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Total Revenue</div>
              <div className="text-2xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {formatINR(stats.totalSales)}
              </div>
            </div>
            <div>
              <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Total Customers</div>
              <div className="text-2xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {stats.totalCustomers}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today & This Month */}
      <div className="grid grid-cols-2 gap-3">
        <div className="pl-card">
          <div className="text-2xl mb-1">📅</div>
          <div className="text-xl font-black gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {formatINR(stats.today.sales)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Today&apos;s Sales</div>
          <div className="text-xs text-indigo-500 mt-1 font-semibold">{stats.today.transactions} txns</div>
        </div>
        <div className="pl-card">
          <div className="text-2xl mb-1">📈</div>
          <div className="text-xl font-black gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {formatINR(stats.month.sales)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">This Month</div>
          <div className="text-xs text-indigo-500 mt-1 font-semibold">{stats.month.transactions} txns</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/merchant/qr', icon: '🔲', label: 'QR Code', gradient: 'from-indigo-500 to-violet-600' },
          { href: '/merchant/offers', icon: '🎯', label: 'Offers', gradient: 'from-orange-400 to-pink-500' },
          { href: '/merchant/analytics', icon: '📊', label: 'Analytics', gradient: 'from-blue-500 to-cyan-500' },
        ].map(action => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:scale-105 transition-transform"
            style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-2xl`}>
              {action.icon}
            </div>
            <span className="text-xs font-semibold text-gray-600">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* 7-Day Sales Chart */}
      <div className="pl-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base">Last 7 Days</h2>
          <Link href="/merchant/analytics" className="text-xs text-indigo-600 font-semibold">Full Analytics →</Link>
        </div>
        <div className="flex items-end gap-2 h-32">
          {dailySales.map((day, i) => {
            const heightPct = (day.sales / maxSales) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-gray-400 font-mono">{day.sales > 0 ? `₹${Math.round(day.sales / 1000)}k` : ''}</div>
                <div className="w-full rounded-t-lg transition-all relative group"
                  style={{ height: `${Math.max(heightPct, 4)}%`, background: 'linear-gradient(180deg, #6366f1, #8b5cf6)', minHeight: '4px' }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {formatINR(day.sales)}
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 text-center leading-tight">{day.date}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Offers Summary */}
      {activeOffers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base">Active Offers 🎯</h2>
            <Link href="/merchant/offers" className="text-xs text-indigo-600 font-semibold">Manage →</Link>
          </div>
          <div className="space-y-2">
            {activeOffers.slice(0, 3).map(offer => (
              <div key={offer.id} className="pl-card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-xl flex-shrink-0">
                  🎯
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{offer.title}</div>
                  <div className="text-xs text-gray-500">
                    {offer.discountType === 'FLAT' ? `₹${offer.discountValue} OFF` : `${offer.discountValue}% OFF`}
                    {' · '}Used {offer.usedCount} times
                  </div>
                </div>
                <span className="pl-badge pl-badge-success text-xs flex-shrink-0">ACTIVE</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">Recent Transactions</h2>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="pl-card text-center py-10">
            <div className="text-4xl mb-3">💳</div>
            <p className="font-semibold text-sm">No transactions yet</p>
            <p className="text-xs text-gray-500">Share your QR code to start accepting payments.</p>
            <Link href="/merchant/qr" className="pl-btn-primary mt-4 text-sm py-2 px-4 inline-flex">Show QR Code</Link>
          </div>
        ) : (
          <div className="pl-card p-0 divide-y">
            {recentTransactions.slice(0, 8).map(tx => (
              <div key={tx.id} className="tx-item px-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: 'var(--muted)' }}>
                  👤
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{tx.student.user.name}</div>
                  <div className="text-xs text-gray-400">{formatDateTime(tx.createdAt)}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-sm text-green-600">+{formatINR(tx.amount)}</div>
                  <div className="text-xs text-gray-400">#{tx.transactionRef?.slice(-6)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
