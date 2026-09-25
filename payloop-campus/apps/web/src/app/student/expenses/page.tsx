'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR, CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/utils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ExpenseData {
  expenses: Array<{ id: string; amount: number; category: string; description: string; merchantName?: string; date: string; }>;
  categoryBreakdown: Array<{ category: string; total: number; count: number }>;
  monthlyTrend: Array<{ month: string; year: number; total: number }>;
}

const EXPENSE_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Education', 'Entertainment', 'Bills', 'Other'];

export default function ExpensesPage() {
  const [data, setData] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ amount: '', category: 'Food', description: '' });
  const [adding, setAdding] = useState(false);

  const load = () => {
    api.student.expenses()
      .then(d => setData(d as ExpenseData))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.student.addExpense({
        amount: parseFloat(addForm.amount),
        category: addForm.category,
        description: addForm.description
      });
      setAddForm({ amount: '', category: 'Food', description: '' });
      setShowAddForm(false);
      load();
    } catch {
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="pl-skeleton h-32 rounded-2xl" />)}</div>;
  }

  const totalSpend = data?.categoryBreakdown.reduce((s, c) => s + c.total, 0) || 0;
  const pieData = data?.categoryBreakdown.map(c => ({
    name: c.category,
    value: c.total,
    fill: CATEGORY_COLORS[c.category] || '#6b7280'
  })) || [];

  return (
    <div className="space-y-5 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Expenses</h1>
          <p className="text-gray-500 text-sm">Track where your money goes</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="pl-btn-primary text-sm py-2 px-4"
        >
          + Add
        </button>
      </div>

      {/* Add expense form */}
      {showAddForm && (
        <div className="pl-card animate-scaleIn">
          <h3 className="font-bold mb-4">Add Manual Expense</h3>
          <form onSubmit={handleAddExpense} className="space-y-3">
            <input
              type="number"
              className="pl-input"
              placeholder="Amount (₹)"
              value={addForm.amount}
              onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))}
              required min="0.01"
            />
            <select
              className="pl-input"
              value={addForm.category}
              onChange={e => setAddForm(p => ({ ...p, category: e.target.value }))}
            >
              {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input
              type="text"
              className="pl-input"
              placeholder="Description"
              value={addForm.description}
              onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))}
              required
            />
            <div className="flex gap-2">
              <button type="submit" disabled={adding} className="pl-btn-primary py-2 px-4 text-sm">
                {adding ? 'Adding...' : 'Add Expense'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="pl-btn-secondary py-2 px-4 text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Total */}
      <div className="pl-gradient-card">
        <div className="text-white/70 text-sm mb-1">Total Spending (This Month)</div>
        <div className="text-3xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {formatINR(totalSpend)}
        </div>
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="pl-card">
          <h3 className="font-bold mb-4">Category Breakdown</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {pieData.sort((a, b) => b.value - a.value).map(cat => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.fill }} />
                  <span className="text-xs text-gray-600 flex-1 truncate">{cat.name}</span>
                  <span className="text-xs font-bold">{formatINR(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Monthly trend bar chart */}
      {data?.monthlyTrend && data.monthlyTrend.length > 0 && (
        <div className="pl-card">
          <h3 className="font-bold mb-4">6-Month Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.monthlyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value) => [formatINR(Number(value ?? 0)), 'Spent']}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transaction list */}
      <div>
        <h3 className="font-bold mb-3">All Expenses</h3>
        {!data?.expenses?.length ? (
          <div className="text-center py-12 pl-card">
            <div className="text-4xl mb-3">📊</div>
            <p className="font-semibold">No expenses yet</p>
            <p className="text-sm text-gray-500">Make payments to track your spending</p>
          </div>
        ) : (
          <div className="pl-card p-0">
            {data.expenses.map(expense => (
              <div key={expense.id} className="tx-item px-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `${CATEGORY_COLORS[expense.category]}20` }}>
                  {CATEGORY_ICONS[expense.category] || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{expense.description}</div>
                  <div className="text-xs text-gray-400">
                    {expense.category} · {new Date(expense.date).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div className="font-bold text-sm text-red-500 flex-shrink-0">-{formatINR(expense.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
