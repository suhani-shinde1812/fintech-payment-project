'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR, formatDateTime, CATEGORY_ICONS } from '@/lib/utils';

interface DashboardData {
  student: {
    name: string;
    email: string;
    demoBalance: number;
    totalPoints: number;
    level: { level: number; name: string; nextLevelPoints: number };
  };
  stats: { monthlySpend: number; savedThisMonth: number; unreadNotifications: number };
  recentTransactions: Array<{
    id: string; transactionRef: string; amount: number; createdAt: string; pointsEarned: number;
    merchant: { businessName: string; category?: { icon: string } };
  }>;
  activeOffers: Array<{
    id: string; title: string; discountType: string; discountValue: number;
    merchant: { businessName: string };
  }>;
}

const levelColors: Record<number, string> = {
  1: 'from-gray-400 to-gray-500',
  2: 'from-blue-400 to-blue-600',
  3: 'from-purple-500 to-violet-600',
  4: 'from-orange-400 to-red-500',
  5: 'from-yellow-400 to-orange-500',
};

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="pl-skeleton h-48 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="pl-skeleton h-24 rounded-xl" />
        <div className="pl-skeleton h-24 rounded-xl" />
      </div>
      <div className="pl-skeleton h-32 rounded-xl" />
      <div className="pl-skeleton h-48 rounded-xl" />
    </div>
  );
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
    else if (hour >= 17 && hour < 21) setGreeting('Good evening');
    else setGreeting('Good night');

    api.student.dashboard()
      .then(d => setData(d as DashboardData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (!data) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">😔</div>
        <p className="text-gray-500">Could not load dashboard. Please refresh.</p>
        <button onClick={() => window.location.reload()} className="pl-btn-primary mt-4">Retry</button>
      </div>
    );
  }

  const { student, stats, recentTransactions, activeOffers } = data;
  const levelGradient = levelColors[student.level.level] || levelColors[1];
  const firstName = student.name.split(' ')[0];
  const maxPoints = student.level.level === 5 ? student.totalPoints :
    student.totalPoints + student.level.nextLevelPoints;
  const progressPct = Math.min(100, (student.totalPoints / maxPoints) * 100);

  return (
    <div className="space-y-4 pb-2 animate-fadeInUp">
      {/* ── Header / Balance Card ─────────────────────────────────────── */}
      <div className="pl-gradient-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/10 translate-y-8 -translate-x-8" />
        <div className="relative">
          <p className="text-white/70 text-sm mb-1">{greeting}, {firstName} 👋</p>
          <p className="text-white/70 text-xs mb-4 uppercase tracking-wider font-medium">Demo Balance</p>
          <div className="text-4xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {formatINR(student.demoBalance)}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="pl-badge text-xs" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              ⚠️ DEMO — No real money
            </span>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { href: '/student/pay', icon: '💳', label: 'Pay', gradient: 'from-indigo-500 to-violet-600' },
          { href: '/student/bills', icon: '⚖️', label: 'Split', gradient: 'from-blue-500 to-cyan-500' },
          { href: '/student/rewards', icon: '🎁', label: 'Rewards', gradient: 'from-violet-500 to-purple-600' },
          { href: '/student/offers', icon: '🎯', label: 'Offers', gradient: 'from-orange-400 to-pink-500' },
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

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="pl-card">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-xl font-black gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {formatINR(stats.savedThisMonth)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Saved this month</div>
        </div>
        <div className="pl-card">
          <div className="text-2xl mb-1">⭐</div>
          <div className="text-xl font-black gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {student.totalPoints.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Loop Points</div>
        </div>
      </div>

      {/* ── Level Card ────────────────────────────────────────────────── */}
      <div className="pl-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${levelGradient} flex items-center justify-center`}>
              <span className="text-white font-black text-sm">L{student.level.level}</span>
            </div>
            <div>
              <div className="font-bold text-sm">{student.level.name}</div>
              <div className="text-xs text-gray-500">Level {student.level.level}</div>
            </div>
          </div>
          <Link href="/student/rewards" className="text-xs text-indigo-600 font-semibold hover:underline">
            View Rewards →
          </Link>
        </div>
        <div className="pl-progress">
          <div className="pl-progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
        {student.level.level < 5 && (
          <div className="text-xs text-gray-400 mt-2">
            {student.level.nextLevelPoints} more points to Level {student.level.level + 1}
          </div>
        )}
      </div>

      {/* ── Today's Offers ────────────────────────────────────────────── */}
      {activeOffers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base">Today&apos;s Offers 🔥</h2>
            <Link href="/student/offers" className="text-xs text-indigo-600 font-semibold">See all →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
            {activeOffers.slice(0, 6).map(offer => (
              <Link
                key={offer.id}
                href={`/student/offers?id=${offer.id}`}
                className="offer-card flex-shrink-0 w-44 snap-start p-4"
              >
                <div className="text-2xl mb-2">{offer.merchant.businessName.includes('Cafe') ? '☕' : offer.merchant.businessName.includes('Pizza') ? '🍕' : '🛍️'}</div>
                <div className="font-bold text-xs text-gray-500 mb-1 truncate">{offer.merchant.businessName}</div>
                <div className="offer-badge bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs">
                  {offer.discountType === 'FLAT' ? `₹${offer.discountValue} OFF` : `${offer.discountValue}% OFF`}
                </div>
                <div className="text-xs text-gray-400 mt-2 truncate">{offer.title}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Transactions ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">Recent Transactions</h2>
          <Link href="/student/expenses" className="text-xs text-indigo-600 font-semibold">See all →</Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="pl-card text-center py-10">
            <div className="text-4xl mb-3">💳</div>
            <p className="font-semibold text-sm mb-1">No transactions yet</p>
            <p className="text-xs text-gray-500 mb-4">Make your first demo payment to see it here.</p>
            <Link href="/student/pay" className="pl-btn-primary text-sm py-2 px-4">Make a Payment</Link>
          </div>
        ) : (
          <div className="pl-card p-0 divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
            {recentTransactions.map(tx => (
              <div key={tx.id} className="tx-item px-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: 'var(--muted)' }}>
                  {tx.merchant.category?.icon || '🏪'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{tx.merchant.businessName}</div>
                  <div className="text-xs text-gray-400">{formatDateTime(tx.createdAt)}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-sm text-red-500">-{formatINR(tx.amount)}</div>
                  <div className="text-xs text-indigo-600">+{tx.pointsEarned} pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── AI Insights Link ──────────────────────────────────────────── */}
      <Link href="/student/ai-insights" className="block">
        <div className="pl-card relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))', borderColor: 'rgba(99,102,241,0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl">
              ✨
            </div>
            <div>
              <div className="font-bold text-sm">PayLoop AI Insights</div>
              <div className="text-xs text-gray-500">Personalized spending summary</div>
            </div>
            <div className="ml-auto text-indigo-600 text-lg">→</div>
          </div>
        </div>
      </Link>
    </div>
  );
}
