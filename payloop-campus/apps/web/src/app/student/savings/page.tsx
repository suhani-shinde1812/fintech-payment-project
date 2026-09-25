'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';

interface SavingsGoal {
  id: string;
  title: string;
  goalType: string;
  target: number;
  current: number;
  deadline?: string;
  isCompleted: boolean;
}

const GOAL_ICONS: Record<string, string> = {
  LAPTOP: '💻', PHONE: '📱', TRIP: '✈️',
  EMERGENCY_FUND: '🛡️', COLLEGE_FEES: '🎓', CUSTOM: '🎯'
};

const GOAL_COLORS: Record<string, string> = {
  LAPTOP: 'from-blue-500 to-indigo-600',
  PHONE: 'from-gray-500 to-gray-700',
  TRIP: 'from-orange-400 to-red-500',
  EMERGENCY_FUND: 'from-green-500 to-emerald-600',
  COLLEGE_FEES: 'from-purple-500 to-violet-600',
  CUSTOM: 'from-pink-500 to-rose-600',
};

const GOAL_TYPES = ['LAPTOP', 'PHONE', 'TRIP', 'EMERGENCY_FUND', 'COLLEGE_FEES', 'CUSTOM'];

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', goalType: 'CUSTOM', target: '', current: '', deadline: '' });
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [updateVal, setUpdateVal] = useState<Record<string, string>>({});

  const load = () => {
    api.student.savings()
      .then(d => setGoals((d as { goals: SavingsGoal[] }).goals || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.student.createGoal({
        title: form.title,
        goalType: form.goalType,
        target: parseFloat(form.target),
        current: parseFloat(form.current || '0'),
        ...(form.deadline ? { deadline: new Date(form.deadline).toISOString() } : {})
      });
      setForm({ title: '', goalType: 'CUSTOM', target: '', current: '', deadline: '' });
      setShowForm(false);
      toast.success('Goal created!');
      load();
    } catch { toast.error('Failed to create goal'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (id: string) => {
    const val = parseFloat(updateVal[id] || '0');
    setUpdating(id);
    try {
      await api.student.updateGoal(id, val);
      toast.success('Progress updated!');
      load();
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  if (loading) return <div className="space-y-4">{[1,2].map(i => <div key={i} className="pl-skeleton h-36 rounded-2xl" />)}</div>;

  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalSaved = goals.reduce((s, g) => s + g.current, 0);

  return (
    <div className="space-y-5 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Savings Goals</h1>
          <p className="text-gray-500 text-sm">Track your financial targets</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="pl-btn-primary text-sm py-2 px-4">
          + New Goal
        </button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="pl-card text-center">
            <div className="text-2xl font-black gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatINR(totalSaved)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Saved</div>
          </div>
          <div className="pl-card text-center">
            <div className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatINR(totalTarget)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Target</div>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="pl-card animate-scaleIn">
          <h3 className="font-bold mb-4">Create New Goal</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {GOAL_TYPES.map(gt => (
                <button
                  key={gt}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, goalType: gt, title: p.title || gt.replace('_', ' ') }))}
                  className={`p-3 rounded-xl text-center transition-all ${form.goalType === gt ? 'ring-2 ring-indigo-500' : 'border border-gray-200 hover:border-gray-300'}`}
                  style={{ background: form.goalType === gt ? 'rgba(99,102,241,0.1)' : 'var(--muted)' }}
                >
                  <div className="text-2xl">{GOAL_ICONS[gt]}</div>
                  <div className="text-xs font-medium mt-1">{gt.replace('_', ' ')}</div>
                </button>
              ))}
            </div>
            <input
              type="text"
              className="pl-input"
              placeholder="Goal name"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required
            />
            <input
              type="number"
              className="pl-input"
              placeholder="Target amount (₹)"
              value={form.target}
              onChange={e => setForm(p => ({ ...p, target: e.target.value }))}
              required min="1"
            />
            <input
              type="number"
              className="pl-input"
              placeholder="Already saved (₹) — optional"
              value={form.current}
              onChange={e => setForm(p => ({ ...p, current: e.target.value }))}
              min="0"
            />
            <input
              type="date"
              className="pl-input"
              value={form.deadline}
              onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
            />
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="pl-btn-primary py-2 px-4 text-sm">
                {saving ? 'Creating...' : 'Create Goal'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="pl-btn-secondary py-2 px-4 text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🎯</div>
          <p className="font-semibold">No savings goals yet</p>
          <p className="text-sm text-gray-500 mb-4">Create your first goal to start tracking savings</p>
          <button onClick={() => setShowForm(true)} className="pl-btn-primary text-sm">Create Goal</button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const pct = Math.min(100, (goal.current / goal.target) * 100);
            const remaining = goal.target - goal.current;
            return (
              <div key={goal.id} className="pl-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${GOAL_COLORS[goal.goalType] || GOAL_COLORS.CUSTOM} flex items-center justify-center text-2xl`}>
                    {GOAL_ICONS[goal.goalType] || '🎯'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">{goal.title}</h3>
                      {goal.isCompleted && <span className="pl-badge pl-badge-success text-xs">✅ Complete</span>}
                    </div>
                    {goal.deadline && (
                      <div className="text-xs text-gray-400">
                        Target: {new Date(goal.deadline).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {Math.round(pct)}%
                    </div>
                  </div>
                </div>

                <div className="pl-progress mb-3">
                  <div className="pl-progress-bar" style={{ width: `${pct}%` }} />
                </div>

                <div className="flex justify-between text-sm mb-4">
                  <div>
                    <div className="font-bold">{formatINR(goal.current)}</div>
                    <div className="text-xs text-gray-400">saved</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatINR(goal.target)}</div>
                    <div className="text-xs text-gray-400">target</div>
                  </div>
                </div>

                {!goal.isCompleted && remaining > 0 && (
                  <div className="text-xs text-gray-400 text-center mb-3">
                    {formatINR(remaining)} more to go
                  </div>
                )}

                {!goal.isCompleted && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="pl-input text-sm py-2 flex-1"
                      placeholder="Update saved amount (₹)"
                      value={updateVal[goal.id] || ''}
                      onChange={e => setUpdateVal(p => ({ ...p, [goal.id]: e.target.value }))}
                      min="0"
                    />
                    <button
                      onClick={() => handleUpdate(goal.id)}
                      disabled={updating === goal.id}
                      className="pl-btn-primary text-sm py-2 px-4 flex-shrink-0"
                    >
                      {updating === goal.id ? '...' : 'Update'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-gray-400 text-center p-4 bg-gray-50 rounded-xl">
        ⚠️ These are tracking goals only. PayLoop does not hold, invest, or manage your money. Not a financial service.
      </div>
    </div>
  );
}
