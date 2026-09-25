'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'FLAT' | 'PERCENTAGE';
  discountValue: number;
  minSpend: number;
  endDate: string;
  isStudentOnly: boolean;
  merchant: { businessName: string; category?: { name: string; icon: string } };
  category?: { name: string; icon: string };
}

const CATEGORIES = ['All', 'Food & Dining', 'Shopping', 'Education', 'Entertainment', 'Fitness', 'Services'];

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('createdAt');

  useEffect(() => {
    const params: Record<string, string> = { sort };
    if (search) params.search = search;
    if (category !== 'All') {
      // Find cat id — simplified: just pass name
    }

    api.offers.list(params)
      .then((d: unknown) => {
        const data = d as { offers: Offer[] };
        setOffers(data.offers || []);
      })
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, [search, category, sort]);

  const filteredOffers = offers.filter(o => {
    if (category === 'All') return true;
    return o.merchant.category?.name === category || o.category?.name === category;
  });

  const getIcon = (offer: Offer) =>
    offer.merchant.category?.icon || offer.category?.icon || '🎯';

  return (
    <div className="space-y-4 animate-fadeInUp">
      <div>
        <h1 className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Student Offers</h1>
        <p className="text-gray-500 text-sm">Exclusive deals for you 🎯</p>
      </div>

      {/* Search */}
      <input
        type="search"
        className="pl-input"
        placeholder="🔍 Search offers..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              category === cat
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">Sort:</span>
        {[
          { value: 'createdAt', label: 'Newest' },
          { value: 'discount', label: 'Best Discount' },
          { value: 'endDate', label: 'Expiring Soon' },
        ].map(s => (
          <button
            key={s.value}
            onClick={() => setSort(s.value)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              sort === s.value ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Offer Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="pl-skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-semibold">No offers found</p>
          <p className="text-gray-500 text-sm">Try a different category or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 stagger-children">
          {filteredOffers.map(offer => (
            <div key={offer.id} className="offer-card animate-fadeInUp p-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: 'var(--muted)' }}>
                  {getIcon(offer)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <div className="font-bold text-sm">{offer.merchant.businessName}</div>
                      <div className="text-xs text-gray-400">{offer.merchant.category?.name}</div>
                    </div>
                    <div className="offer-badge text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      {offer.discountType === 'FLAT'
                        ? `₹${offer.discountValue} OFF`
                        : `${offer.discountValue}% OFF`}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{offer.description}</p>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {offer.minSpend > 0 && (
                        <span className="text-xs text-gray-400">Min. {formatINR(offer.minSpend)}</span>
                      )}
                      {offer.isStudentOnly && (
                        <span className="pl-badge pl-badge-primary text-xs">🎓 Students</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Expires {formatDate(offer.endDate)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
