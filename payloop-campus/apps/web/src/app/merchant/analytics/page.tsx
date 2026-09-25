'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';

interface MonthlySale { month: string; sales: number; transactions: number; }
interface OfferPerformance {
  id: string; title: string; discountType: string; discountValue: number;
  status: string; usedCount: number; usageLimit?: number;
  _count: { redemptions: number };
}
interface AnalyticsData {
  monthlySales: MonthlySale[];
  offerPerformance: OfferPerformance[];
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="pl-skeleton h-10 rounded-xl w-40" />
      <div className="pl-skeleton h-64 rounded-2xl" />
      <div className="pl-skeleton h-48 rounded-2xl" />
    </div>
  );
}

export default function MerchantAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.merchants.analytics()
      .then(d => setData(d as AnalyticsData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  if (!data) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">📉</div>
        <p className="text-gray-500">Could not load analytics. Please refresh.</p>
        <button onClick={() => window.location.reload()} className="pl-btn-primary mt-4">Retry</button>
      </div>
    );
  }

  const { monthlySales, offerPerformance } = data;
  const maxSales = Math.max(...monthlySales.map(m => m.sales), 1);
  const totalRevenue = monthlySales.reduce((acc, m) => acc + m.sales, 0);
  const totalTxns = monthlySales.reduce((acc, m) => acc + m.transactions, 0);
  const bestMonth = monthlySales.reduce((a, b) => a.sales > b.sales ? a : b, monthlySales[0] || { sales: 0, month: '-' });

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div>
        <h1 className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Analytics 📊</h1>
        <p className="text-sm text-gray-500 mt-1">6-month performance overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="pl-card text-center p-3">
          <div className="text-lg font-black gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {formatINR(totalRevenue)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">6-Month Revenue</div>
        </div>
        <div className="pl-card text-center p-3">
          <div className="text-lg font-black gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {totalTxns}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Total Transactions</div>
        </div>
        <div className="pl-card text-center p-3">
          <div className="text-lg font-black gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {totalTxns > 0 ? formatINR(Math.round(totalRevenue / totalTxns)) : '₹0'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Avg per Txn</div>
        </div>
      </div>

      {/* Monthly Sales Chart */}
      <div className="pl-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-base">Monthly Revenue</h2>
          {bestMonth.sales > 0 && (
            <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
              Best: {bestMonth.month} 🏆
            </span>
          )}
        </div>
        <div className="flex items-end gap-3 h-40 mt-4">
          {monthlySales.map((month, i) => {
            const heightPct = (month.sales / maxSales) * 100;
            const isLatest = i === monthlySales.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-gray-400">
                  {month.sales > 0 ? `₹${Math.round(month.sales / 1000)}k` : ''}
                </div>
                <div className="w-full rounded-t-xl relative group transition-all"
                  style={{
                    height: `${Math.max(heightPct, 4)}%`,
                    background: isLatest
                      ? 'linear-gradient(180deg, #6366f1, #8b5cf6)'
                      : 'linear-gradient(180deg, #a5b4fc, #c4b5fd)',
                    minHeight: '4px'
                  }}>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {formatINR(month.sales)}<br />{month.transactions} txns
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 font-medium">{month.month}</div>
              </div>
            );
          })}
        </div>
        {monthlySales.every(m => m.sales === 0) && (
          <div className="text-center py-4 text-sm text-gray-400">No sales data yet — accept your first payment to see analytics!</div>
        )}
      </div>

      {/* Transactions per Month Bar */}
      <div className="pl-card">
        <h2 className="font-bold text-base mb-4">Transactions per Month</h2>
        <div className="space-y-3">
          {[...monthlySales].reverse().map((month, i) => {
            const maxTxns = Math.max(...monthlySales.map(m => m.transactions), 1);
            const widthPct = (month.transactions / maxTxns) * 100;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 text-xs text-gray-500 font-medium text-right">{month.month}</div>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(widthPct, 2)}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                  />
                </div>
                <div className="w-12 text-xs font-semibold text-indigo-600 text-right">{month.transactions}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Offer Performance */}
      <div>
        <h2 className="font-bold text-base mb-3">Offer Performance 🎯</h2>
        {offerPerformance.length === 0 ? (
          <div className="pl-card text-center py-10">
            <div className="text-4xl mb-3">🎯</div>
            <p className="font-semibold text-sm">No offers yet</p>
            <p className="text-xs text-gray-500">Create your first offer to see performance data.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offerPerformance.map(offer => {
              const usageRate = offer.usageLimit
                ? Math.min(100, (offer.usedCount / offer.usageLimit) * 100)
                : null;
              const statusColor = offer.status === 'ACTIVE' ? 'pl-badge-success' :
                offer.status === 'PENDING_APPROVAL' ? 'pl-badge-warning' :
                offer.status === 'EXPIRED' ? 'bg-gray-100 text-gray-500' : 'pl-badge-danger';
              return (
                <div key={offer.id} className="pl-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{offer.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {offer.discountType === 'FLAT' ? `₹${offer.discountValue} OFF` : `${offer.discountValue}% OFF`}
                      </div>
                    </div>
                    <span className={`pl-badge ${statusColor} text-xs ml-2 flex-shrink-0`}>
                      {offer.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-indigo-50 rounded-xl p-3 text-center">
                      <div className="text-lg font-black text-indigo-700">{offer.usedCount}</div>
                      <div className="text-xs text-indigo-500">Times Used</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                      <div className="text-lg font-black text-purple-700">{offer._count.redemptions}</div>
                      <div className="text-xs text-purple-500">Redemptions</div>
                    </div>
                  </div>
                  {usageRate !== null && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Usage</span>
                        <span>{offer.usedCount}/{offer.usageLimit}</span>
                      </div>
                      <div className="pl-progress">
                        <div className="pl-progress-bar" style={{ width: `${usageRate}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
