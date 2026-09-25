'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';

interface User { id: string; name: string; email: string; }
interface BillParticipant { id: string; userId: string; amount: number; isPaid: boolean; user?: User; }
interface Bill { id: string; title: string; total: number; splitType: string; status: string; createdAt: string; creator?: User; participants: BillParticipant[]; }

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'pl-badge-warning',
  PARTIALLY_PAID: 'pl-badge-primary',
  SETTLED: 'pl-badge-success'
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', total: '', splitType: 'EQUAL', participants: [{ userId: '', amount: '' }] });
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    api.bills.list()
      .then(d => setBills((d as { bills: Bill[] }).bills || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const addParticipant = () => setForm(p => ({
    ...p,
    participants: [...p.participants, { userId: '', amount: '' }]
  }));

  const removeParticipant = (i: number) => setForm(p => ({
    ...p,
    participants: p.participants.filter((_, idx) => idx !== i)
  }));

  const updateParticipant = (i: number, key: string, val: string) => setForm(p => ({
    ...p,
    participants: p.participants.map((pt, idx) => idx === i ? { ...pt, [key]: val } : pt)
  }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const participants = form.participants
        .filter(p => p.userId.trim())
        .map(p => ({
          userId: p.userId.trim(),
          amount: p.amount ? parseFloat(p.amount) : undefined
        }));

      await api.bills.create({
        title: form.title,
        total: parseFloat(form.total),
        splitType: form.splitType,
        participants
      });

      setForm({ title: '', total: '', splitType: 'EQUAL', participants: [{ userId: '', amount: '' }] });
      setShowForm(false);
      toast.success('Bill created!');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create bill');
    } finally {
      setCreating(false);
    }
  };

  const handlePay = async (billId: string) => {
    try {
      await api.bills.pay(billId);
      toast.success('Marked as paid!');
      load();
    } catch { toast.error('Failed to mark as paid'); }
  };

  if (loading) return <div className="space-y-4">{[1,2].map(i => <div key={i} className="pl-skeleton h-32 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-4 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Split Bills</h1>
          <p className="text-gray-500 text-sm">Settle up with friends</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="pl-btn-primary text-sm py-2 px-4">
          + New Bill
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="pl-card animate-scaleIn">
          <h3 className="font-bold mb-4">Create Bill</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              className="pl-input"
              placeholder="Bill title (e.g. Dinner at Pizza Hub)"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required
            />
            <input
              type="number"
              className="pl-input"
              placeholder="Total amount (₹)"
              value={form.total}
              onChange={e => setForm(p => ({ ...p, total: e.target.value }))}
              required min="1"
            />
            <div className="flex gap-2">
              {['EQUAL', 'CUSTOM', 'PERCENTAGE'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, splitType: t }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    form.splitType === t ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t === 'EQUAL' ? '= Equal' : t === 'CUSTOM' ? '₹ Custom' : '% Percent'}
                </button>
              ))}
            </div>

            {/* Participants */}
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Participants</div>
              <div className="space-y-2">
                {form.participants.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      className="pl-input flex-1 text-sm"
                      placeholder="User ID or email"
                      value={p.userId}
                      onChange={e => updateParticipant(i, 'userId', e.target.value)}
                    />
                    {form.splitType !== 'EQUAL' && (
                      <input
                        type="number"
                        className="pl-input w-24 text-sm"
                        placeholder={form.splitType === 'PERCENTAGE' ? '%' : '₹'}
                        value={p.amount}
                        onChange={e => updateParticipant(i, 'amount', e.target.value)}
                        min="0"
                      />
                    )}
                    {form.participants.length > 1 && (
                      <button type="button" onClick={() => removeParticipant(i)} className="text-red-500 text-sm px-2">✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addParticipant} className="text-indigo-600 text-sm font-medium mt-2">+ Add person</button>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={creating} className="pl-btn-primary py-2 px-4 text-sm">
                {creating ? 'Creating...' : 'Create Bill'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="pl-btn-secondary py-2 px-4 text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bills list */}
      {bills.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">⚖️</div>
          <p className="font-semibold">No bills yet</p>
          <p className="text-sm text-gray-500 mb-4">Split your next group expense easily</p>
          <button onClick={() => setShowForm(true)} className="pl-btn-primary text-sm">Create Bill</button>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map(bill => (
            <div key={bill.id} className="pl-card cursor-pointer" onClick={() => setExpanded(expanded === bill.id ? null : bill.id)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">⚖️</div>
                  <div>
                    <div className="font-bold text-sm">{bill.title}</div>
                    <div className="text-xs text-gray-400">
                      {bill.participants.length} people · {bill.splitType}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-base gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {formatINR(bill.total)}
                  </div>
                  <span className={`pl-badge text-xs ${STATUS_COLORS[bill.status] || ''}`}>
                    {bill.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {expanded === bill.id && (
                <div className="border-t border-gray-100 pt-4 mt-4 space-y-2 animate-fadeInUp">
                  {bill.participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.isPaid ? 'bg-green-500' : 'bg-orange-400'}`} />
                        <span className="text-sm">{p.user?.name || 'Participant'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{formatINR(p.amount)}</span>
                        {!p.isPaid && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePay(bill.id); }}
                            className="pl-badge pl-badge-primary text-xs cursor-pointer hover:bg-indigo-200"
                          >
                            Mark Paid
                          </button>
                        )}
                        {p.isPaid && <span className="text-green-500 text-xs">✅ Paid</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
