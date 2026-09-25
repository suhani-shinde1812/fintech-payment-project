'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';

type Step = 'merchant' | 'amount' | 'confirm' | 'processing' | 'success';

interface Merchant {
  id: string;
  businessName: string;
  description?: string;
  category?: { name: string; icon: string };
  offers?: Array<{ id: string; title: string; discountType: string; discountValue: number; minSpend: number }>;
}

interface PaymentResult {
  transaction: { id: string; transactionRef: string };
  pointsEarned: number;
  finalAmount: number;
  appliedDiscount: number;
  merchant: { name: string };
}

export default function PayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('merchant');
  const [merchantId, setMerchantId] = useState(searchParams.get('merchantId') || '');
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [loadingMerchant, setLoadingMerchant] = useState(false);

  useEffect(() => {
    const mid = searchParams.get('merchantId');
    if (mid) {
      setMerchantId(mid);
      fetchMerchant(mid);
    }
  }, [searchParams]);

  const fetchMerchant = async (id: string) => {
    setLoadingMerchant(true);
    try {
      const data = await api.merchants.get(id) as { merchant: Merchant };
      setMerchant(data.merchant);
      setStep('amount');
    } catch {
      toast.error('Merchant not found');
    } finally {
      setLoadingMerchant(false);
    }
  };

  const handleMerchantLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId.trim()) return;
    fetchMerchant(merchantId.trim());
  };

  const handlePay = async () => {
    if (!merchant || !amount || parseFloat(amount) <= 0) return;
    setStep('processing');

    await new Promise(r => setTimeout(r, 1500)); // Simulate processing

    try {
      const data = await api.payments.create({
        merchantId: merchant.id,
        amount: parseFloat(amount),
        offerId: selectedOfferId
      }) as PaymentResult;
      setResult(data);
      setStep('success');
    } catch (err: unknown) {
      setStep('confirm');
      const msg = err instanceof Error ? err.message : 'Payment failed';
      toast.error(msg);
    }
  };

  const applicableOffer = merchant?.offers?.find(o =>
    o.minSpend <= parseFloat(amount || '0')
  );

  const discountAmount = applicableOffer && selectedOfferId === applicableOffer.id
    ? applicableOffer.discountType === 'FLAT'
      ? applicableOffer.discountValue
      : (parseFloat(amount) * applicableOffer.discountValue) / 100
    : 0;

  return (
    <div className="payment-screen">
      {/* ── Demo Banner ─────────────────────────────────────────────────── */}
      <div className="sticky top-14 z-30 py-2 px-4 text-center text-xs font-bold text-white"
        style={{ background: 'linear-gradient(90deg, #f97316, #ef4444)' }}>
        ⚠️ DEMO PAYMENT · NO REAL MONEY IS MOVED
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
        {/* ── Step 1: Merchant ──────────────────────────────────────────── */}
        {step === 'merchant' && (
          <div className="animate-fadeInUp space-y-6">
            <div>
              <h1 className="text-2xl font-black mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Scan & Pay</h1>
              <p className="text-gray-500 text-sm">Enter merchant ID to pay</p>
            </div>

            <form onSubmit={handleMerchantLookup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Merchant ID</label>
                <input
                  type="text"
                  className="pl-input text-center text-lg font-bold tracking-wider"
                  placeholder="PLM-XXXXXXXX"
                  value={merchantId}
                  onChange={e => setMerchantId(e.target.value.toUpperCase())}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-400 mt-1 text-center">
                  Scan QR code or enter merchant ID manually
                </p>
              </div>
              <button
                type="submit"
                disabled={loadingMerchant || !merchantId.trim()}
                className="pl-btn-primary w-full justify-center py-3"
              >
                {loadingMerchant ? 'Looking up...' : 'Find Merchant'}
              </button>
            </form>

            {/* Quick merchant buttons for demo */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Demo Merchants</p>
              <div className="space-y-2">
                {['Campus Cafe', 'Pizza Hub', 'Campus Print Center'].map(name => (
                  <button
                    key={name}
                    onClick={async () => {
                      setLoadingMerchant(true);
                      try {
                        const data = await api.merchants.list() as { merchants: Merchant[] };
                        const m = data.merchants.find(m => m.businessName === name);
                        if (m) {
                          setMerchantId(m.id);
                          await fetchMerchant(m.id);
                        }
                      } catch { setLoadingMerchant(false); }
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    style={{ border: '1px solid var(--card-border)', background: 'var(--card)' }}
                  >
                    <span className="text-2xl">{name.includes('Cafe') ? '☕' : name.includes('Pizza') ? '🍕' : '🖨️'}</span>
                    <span className="text-sm font-semibold">{name}</span>
                    <span className="ml-auto text-gray-400 text-sm">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Amount ────────────────────────────────────────────── */}
        {step === 'amount' && merchant && (
          <div className="animate-fadeInUp space-y-6">
            <button onClick={() => setStep('merchant')} className="text-indigo-600 font-semibold text-sm flex items-center gap-1">
              ← Back
            </button>

            <div className="pl-card text-center">
              <div className="text-4xl mb-2">
                {merchant.category?.icon || '🏪'}
              </div>
              <h2 className="font-black text-xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{merchant.businessName}</h2>
              <p className="text-gray-500 text-sm mt-1">{merchant.description || merchant.category?.name}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-center">Enter Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  min="1"
                  max="50000"
                  step="0.01"
                  className="pl-input text-center text-3xl font-black pl-10 h-16"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  autoFocus
                />
              </div>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2 flex-wrap justify-center">
              {[50, 100, 150, 200, 250, 300, 500].map(a => (
                <button
                  key={a}
                  onClick={() => setAmount(String(a))}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                    amount === String(a) ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                  }`}
                >
                  ₹{a}
                </button>
              ))}
            </div>

            {/* Applicable offers */}
            {merchant.offers && merchant.offers.length > 0 && parseFloat(amount) > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Available Offers</p>
                {merchant.offers.map(offer => {
                  const applicable = parseFloat(amount) >= offer.minSpend;
                  return (
                    <button
                      key={offer.id}
                      onClick={() => applicable && setSelectedOfferId(selectedOfferId === offer.id ? undefined : offer.id)}
                      disabled={!applicable}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all ${
                        selectedOfferId === offer.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                      } ${applicable ? '' : 'opacity-50 cursor-not-allowed'}`}
                      style={{ border: `1.5px solid ${selectedOfferId === offer.id ? '#6366f1' : 'var(--card-border)'}`, background: selectedOfferId === offer.id ? 'rgba(99,102,241,0.05)' : 'var(--card)' }}
                    >
                      <span className="text-lg">{applicable ? '✅' : '🔒'}</span>
                      <div className="text-left">
                        <div className="text-sm font-semibold">{offer.title}</div>
                        <div className="text-xs text-gray-400">
                          {applicable ? 'Applicable!' : `Min. ₹${offer.minSpend} required`}
                        </div>
                      </div>
                      <div className="ml-auto text-sm font-bold text-indigo-600">
                        {offer.discountType === 'FLAT' ? `-₹${offer.discountValue}` : `-${offer.discountValue}%`}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setStep('confirm')}
              disabled={!amount || parseFloat(amount) <= 0}
              className="pl-btn-primary w-full justify-center py-4 text-base"
            >
              Continue to Pay {amount ? formatINR(parseFloat(amount) - discountAmount) : ''}
            </button>
          </div>
        )}

        {/* ── Step 3: Confirm ───────────────────────────────────────────── */}
        {step === 'confirm' && merchant && (
          <div className="animate-fadeInUp space-y-4">
            <h1 className="text-2xl font-black mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Confirm Payment</h1>

            <div className="pl-card">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
                <div className="text-3xl">{merchant.category?.icon || '🏪'}</div>
                <div>
                  <div className="font-bold">{merchant.businessName}</div>
                  <div className="text-xs text-gray-500">{merchant.category?.name}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold">{formatINR(parseFloat(amount))}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Offer Discount</span>
                    <span className="font-semibold text-green-600">-{formatINR(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="font-bold">Total Payable</span>
                  <span className="text-xl font-black gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {formatINR(parseFloat(amount) - discountAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Payment Method</span>
                  <span className="text-indigo-600 font-medium">PayLoop Demo Balance</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Estimated Points</span>
                  <span className="text-indigo-600 font-medium">+{Math.floor((parseFloat(amount) - discountAmount) * 0.05)} Loop Points</span>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-700 text-center">
              ⚠️ <strong>DEMO PAYMENT</strong> — This is a simulation. No real money will be charged.
            </div>

            <button
              onClick={handlePay}
              className="pl-btn-primary w-full justify-center py-4 text-base"
              id="confirm-pay-btn"
            >
              Pay {formatINR(parseFloat(amount) - discountAmount)}
            </button>

            <button onClick={() => setStep('amount')} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2">
              ← Change Amount
            </button>
          </div>
        )}

        {/* ── Step 4: Processing ────────────────────────────────────────── */}
        {step === 'processing' && (
          <div className="animate-fadeIn flex flex-col items-center justify-center min-h-64 gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">💳</div>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Processing Payment...</p>
              <p className="text-gray-500 text-sm mt-1">This is a demo simulation</p>
            </div>
          </div>
        )}

        {/* ── Step 5: Success ───────────────────────────────────────────── */}
        {step === 'success' && result && (
          <div className="animate-scaleIn space-y-6 text-center">
            {/* Success animation */}
            <div className="py-6">
              <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-5xl mb-4 payment-success-animation"
                style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                ✅
              </div>
              <h1 className="text-3xl font-black text-green-600 mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Payment Successful! 🎉
              </h1>
              <p className="text-gray-500 text-sm">Demo payment processed</p>
            </div>

            <div className="pl-card text-left">
              <div className="text-center mb-4">
                <div className="text-4xl font-black gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatINR(result.finalAmount)}
                </div>
                <div className="text-gray-500 text-sm">{result.merchant.name}</div>
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{result.transaction.transactionRef}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Loop Points Earned</span>
                  <span className="animate-bouncePoints pl-badge pl-badge-primary font-bold">
                    +{result.pointsEarned} pts ⭐
                  </span>
                </div>
                {result.appliedDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Offer Savings</span>
                    <span className="text-green-600 font-bold">{formatINR(result.appliedDiscount)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-700 text-center">
              ⚠️ DEMO — No real money was moved. This is a simulation.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('merchant'); setMerchant(null); setMerchantId(''); setAmount(''); setResult(null); }}
                className="flex-1 pl-btn-secondary py-3 text-sm"
              >
                New Payment
              </button>
              <button
                onClick={() => router.push('/student/dashboard')}
                className="flex-1 pl-btn-primary py-3 text-sm justify-center"
              >
                Go Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
