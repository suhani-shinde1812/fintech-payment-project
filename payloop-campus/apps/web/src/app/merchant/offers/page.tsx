'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Offer {
  id: string;
  title: string;
  description?: string;
  discountType: 'FLAT' | 'PERCENTAGE';
  discountValue: number;
  minSpend?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  isStudentOnly: boolean;
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'pl-badge-success',
  PENDING_APPROVAL: 'pl-badge-warning',
  PAUSED: 'bg-gray-100 text-gray-500',
  EXPIRED: 'bg-gray-100 text-gray-400',
  REJECTED: 'pl-badge-danger',
};

function CreateOfferModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minSpend: '',
    maxDiscount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    isStudentOnly: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.merchants.offers.create({
        title: form.title,
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minSpend: form.minSpend ? Number(form.minSpend) : undefined,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        isStudentOnly: form.isStudentOnly,
      });
      toast.success('✅ Offer submitted for approval!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create offer';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto animate-scaleIn" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Create New Offer 🎯</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Offer Title *</label>
            <input className="pl-input" placeholder="e.g. 20% off on all orders" required
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
            <textarea className="pl-input" rows={2} placeholder="Optional details about the offer"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Discount Type *</label>
              <select className="pl-input" value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Value * {form.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
              </label>
              <input className="pl-input" type="number" min="1" required placeholder={form.discountType === 'PERCENTAGE' ? '20' : '50'}
                value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Min Spend (₹)</label>
              <input className="pl-input" type="number" min="0" placeholder="Optional"
                value={form.minSpend} onChange={e => setForm(f => ({ ...f, minSpend: e.target.value }))} />
            </div>
            {form.discountType === 'PERCENTAGE' && (
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Max Discount (₹)</label>
                <input className="pl-input" type="number" min="0" placeholder="Optional cap"
                  value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Start Date *</label>
              <input className="pl-input" type="date" required
                value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">End Date *</label>
              <input className="pl-input" type="date" required
                value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Usage Limit (optional)</label>
            <input className="pl-input" type="number" min="1" placeholder="Leave blank for unlimited"
              value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50">
            <input type="checkbox" id="studentOnly" checked={form.isStudentOnly}
              onChange={e => setForm(f => ({ ...f, isStudentOnly: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600" />
            <label htmlFor="studentOnly" className="text-sm font-medium text-indigo-700">🎓 Student-only offer</label>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
            ⚠️ Offers are reviewed by admin before going live. Approval typically takes a few hours.
          </div>
          <button type="submit" disabled={saving} className="pl-btn-primary w-full justify-center">
            {saving ? 'Submitting...' : '🎯 Submit for Approval'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MerchantOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.merchants.offers.list()
      .then(d => setOffers((d as { offers: Offer[] }).offers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this offer?')) return;
    setDeleting(id);
    try {
      await api.merchants.offers.delete(id);
      toast.success('Offer deleted');
      load();
    } catch {
      toast.error('Failed to delete offer');
    } finally {
      setDeleting(null);
    }
  };

  const activeCount = offers.filter(o => o.status === 'ACTIVE').length;
  const pendingCount = offers.filter(o => o.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-5 animate-fadeInUp">
      {showCreate && <CreateOfferModal onClose={() => setShowCreate(false)} onSuccess={load} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>My Offers 🎯</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage your student offers</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="pl-btn-primary text-sm py-2 px-4">
          + New Offer
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="pl-card text-center p-3">
          <div className="text-2xl font-black gradient-text">{offers.length}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="pl-card text-center p-3">
          <div className="text-2xl font-black text-green-600">{activeCount}</div>
          <div className="text-xs text-gray-500">Active</div>
        </div>
        <div className="pl-card text-center p-3">
          <div className="text-2xl font-black text-amber-500">{pendingCount}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
      </div>

      {/* Offers List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="pl-skeleton h-32 rounded-2xl" />)}
        </div>
      ) : offers.length === 0 ? (
        <div className="pl-card text-center py-16">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="font-bold text-lg mb-2">No offers yet</h2>
          <p className="text-sm text-gray-500 mb-6">Create your first offer to attract more students!</p>
          <button onClick={() => setShowCreate(true)} className="pl-btn-primary">
            Create First Offer
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(offer => (
            <div key={offer.id} className="pl-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base truncate">{offer.title}</h3>
                    {offer.isStudentOnly && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">🎓 Students</span>}
                  </div>
                  {offer.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{offer.description}</p>}
                </div>
                <span className={`pl-badge ${STATUS_STYLES[offer.status] || 'bg-gray-100 text-gray-500'} text-xs ml-2 flex-shrink-0`}>
                  {offer.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-indigo-50 rounded-xl p-2 text-center">
                  <div className="font-black text-indigo-700 text-sm">
                    {offer.discountType === 'FLAT' ? `₹${offer.discountValue}` : `${offer.discountValue}%`}
                  </div>
                  <div className="text-[10px] text-indigo-500">Discount</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-2 text-center">
                  <div className="font-black text-gray-700 text-sm">{offer.usedCount}</div>
                  <div className="text-[10px] text-gray-500">Used</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-2 text-center">
                  <div className="font-black text-gray-700 text-sm">{offer.usageLimit ?? '∞'}</div>
                  <div className="text-[10px] text-gray-500">Limit</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{formatDate(offer.startDate)} → {formatDate(offer.endDate)}</span>
                {offer.minSpend && <span>Min: ₹{offer.minSpend}</span>}
              </div>

              {offer.status !== 'EXPIRED' && (
                <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--card-border)' }}>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    disabled={deleting === offer.id}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    {deleting === offer.id ? '...' : '🗑️ Delete'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
