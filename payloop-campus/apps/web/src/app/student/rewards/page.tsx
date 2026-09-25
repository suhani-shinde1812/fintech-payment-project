'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';

interface LevelInfo { level: number; name: string; nextLevelPoints: number; }
interface Reward { id: string; title: string; description: string; type: string; pointsCost: number; value?: number; }
interface Coupon { id: string; code: string; value: number; description: string; expiresAt: string; reward?: Reward; }
interface LedgerEntry { id: string; points: number; description: string; createdAt: string; }

interface RewardsData {
  totalPoints: number;
  levelInfo: LevelInfo;
  rewards: Reward[];
  ledger: LedgerEntry[];
  activeCoupons: Coupon[];
}

const LEVEL_COLORS: Record<number, string> = {
  1: 'from-gray-400 to-gray-500',
  2: 'from-blue-400 to-blue-600',
  3: 'from-purple-500 to-violet-600',
  4: 'from-orange-400 to-red-500',
  5: 'from-yellow-400 to-orange-500',
};
const LEVEL_NAMES = ['', 'Newbie', 'Regular', 'Smart Saver', 'Local VIP', 'PayLoop Pro'];
const LEVEL_THRESHOLDS = [0, 0, 500, 1500, 3000, 6000];

export default function RewardsPage() {
  const [data, setData] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [tab, setTab] = useState<'rewards' | 'coupons' | 'history'>('rewards');

  const load = () => {
    api.rewards.list()
      .then(d => setData(d as RewardsData))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRedeem = async (rewardId: string, pointsCost: number) => {
    if (!data || data.totalPoints < pointsCost) {
      toast.error(`Need ${pointsCost} points — you have ${data?.totalPoints}`);
      return;
    }
    setRedeeming(rewardId);
    try {
      await api.rewards.redeem(rewardId);
      toast.success('🎉 Reward redeemed! Check your coupons.');
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Redemption failed';
      toast.error(msg);
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="pl-skeleton h-24 rounded-2xl" />)}</div>;
  }

  if (!data) return null;

  const { totalPoints, levelInfo, rewards, ledger, activeCoupons } = data;
  const nextLevel = levelInfo.level < 5 ? levelInfo.level + 1 : null;
  const currentThreshold = LEVEL_THRESHOLDS[levelInfo.level];
  const nextThreshold = nextLevel ? LEVEL_THRESHOLDS[nextLevel] : totalPoints;
  const progressPct = nextLevel
    ? Math.min(100, ((totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header card */}
      <div className={`rounded-2xl p-6 bg-gradient-to-br ${LEVEL_COLORS[levelInfo.level] || LEVEL_COLORS[1]} text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="relative">
          <div className="text-4xl font-black mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {totalPoints.toLocaleString()}
          </div>
          <div className="text-white/80 text-sm mb-4">Loop Points</div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Level {levelInfo.level} · {levelInfo.name}</span>
            {nextLevel && <span className="text-xs text-white/70">Level {nextLevel}: {levelInfo.nextLevelPoints} pts away</span>}
          </div>
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* All 5 levels */}
      <div className="grid grid-cols-5 gap-2">
        {[1,2,3,4,5].map(l => (
          <div key={l} className={`rounded-xl p-2 text-center ${l <= levelInfo.level ? `bg-gradient-to-br ${LEVEL_COLORS[l]}` : 'bg-gray-100'}`}>
            <div className={`text-xs font-bold ${l <= levelInfo.level ? 'text-white' : 'text-gray-400'}`}>L{l}</div>
            <div className={`text-[10px] ${l <= levelInfo.level ? 'text-white/80' : 'text-gray-400'} hidden sm:block`}>
              {LEVEL_NAMES[l]}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {[
          { key: 'rewards', label: '🎁 Redeem' },
          { key: 'coupons', label: `🎫 My Coupons ${activeCoupons.length > 0 ? `(${activeCoupons.length})` : ''}` },
          { key: 'history', label: '📋 History' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Rewards tab */}
      {tab === 'rewards' && (
        <div className="space-y-3">
          {rewards.map(reward => {
            const canRedeem = totalPoints >= reward.pointsCost;
            return (
              <div key={reward.id} className="pl-card flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: 'var(--muted)' }}>
                  {reward.type === 'COUPON' ? '🎫' : reward.type === 'FREE_ITEM' ? '🆓' : reward.type === 'DISCOUNT' ? '💯' : '💵'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{reward.title}</div>
                  <div className="text-xs text-gray-500 mb-2">{reward.description}</div>
                  <div className="flex items-center gap-2">
                    <span className={`pl-badge text-xs ${canRedeem ? 'pl-badge-primary' : 'bg-gray-100 text-gray-500'}`}>
                      ⭐ {reward.pointsCost} pts
                    </span>
                    {reward.value && (
                      <span className="text-xs text-green-600 font-semibold">Worth {formatINR(reward.value)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRedeem(reward.id, reward.pointsCost)}
                  disabled={!canRedeem || redeeming === reward.id}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    canRedeem
                      ? 'pl-btn-primary py-2 px-4'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {redeeming === reward.id ? '...' : canRedeem ? 'Redeem' : 'Need more pts'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Coupons tab */}
      {tab === 'coupons' && (
        <div className="space-y-3">
          {activeCoupons.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🎫</div>
              <p className="font-semibold">No active coupons</p>
              <p className="text-sm text-gray-500">Redeem your Loop Points to get coupons!</p>
            </div>
          ) : activeCoupons.map(coupon => (
            <div key={coupon.id} className="pl-card"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))', borderColor: 'rgba(99,102,241,0.2)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm">{coupon.description}</span>
                <span className="pl-badge pl-badge-success text-xs">{formatINR(coupon.value)} OFF</span>
              </div>
              <div className="bg-white rounded-xl p-3 text-center border border-dashed border-indigo-300">
                <div className="font-mono text-lg font-black text-indigo-700 tracking-widest">{coupon.code}</div>
                <div className="text-xs text-gray-400 mt-1">Valid until {new Date(coupon.expiresAt).toLocaleDateString('en-IN')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="pl-card p-0 divide-y">
          {ledger.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No points history yet</p>
            </div>
          ) : ledger.map(entry => (
            <div key={entry.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-semibold">{entry.description}</div>
                <div className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
              <div className={`font-bold ${entry.points >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {entry.points >= 0 ? '+' : ''}{entry.points} pts
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
