'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface QrData {
  qrCode: string;
  qrData: string;
  merchantId: string;
  businessName: string;
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="pl-skeleton h-10 rounded-xl w-32" />
      <div className="pl-skeleton h-72 rounded-2xl" />
      <div className="pl-skeleton h-20 rounded-xl" />
    </div>
  );
}

export default function MerchantQR() {
  const [data, setData] = useState<QrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.merchants.qr()
      .then(d => setData(d as QrData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.qrData);
      setCopied(true);
      toast.success('Payment link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleDownload = () => {
    if (!data?.qrCode) return;
    const link = document.createElement('a');
    link.href = data.qrCode;
    link.download = `payloop-qr-${data.businessName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
    toast.success('QR code downloaded!');
  };

  if (loading) return <Skeleton />;

  if (!data) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">😔</div>
        <p className="text-gray-500">Could not load QR code. Please refresh.</p>
        <button onClick={() => window.location.reload()} className="pl-btn-primary mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div>
        <h1 className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Payment QR Code 🔲</h1>
        <p className="text-sm text-gray-500 mt-1">Show this to students to accept demo payments</p>
      </div>

      {/* QR Card */}
      <div className="pl-card flex flex-col items-center py-8">
        {/* Decorative gradient ring */}
        <div className="relative p-3 rounded-3xl mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)', padding: '4px' }}>
          <div className="rounded-2xl bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.qrCode}
              alt={`PayLoop QR for ${data.businessName}`}
              className="w-56 h-56 rounded-xl"
            />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{data.businessName}</h2>
          <p className="text-sm text-gray-500 mt-1">PayLoop Merchant · Demo Mode</p>
        </div>

        {/* Payment link */}
        <div className="mt-4 w-full max-w-xs bg-gray-50 rounded-xl p-3 flex items-center gap-2">
          <code className="text-xs text-gray-500 flex-1 truncate font-mono">{data.qrData}</code>
          <button
            onClick={handleCopy}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors flex-shrink-0"
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleDownload} className="pl-btn-secondary justify-center text-sm py-3">
          📥 Download PNG
        </button>
        <button
          onClick={() => window.print()}
          className="pl-btn-secondary justify-center text-sm py-3"
        >
          🖨️ Print QR
        </button>
      </div>

      {/* Instructions */}
      <div className="pl-card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))', borderColor: 'rgba(99,102,241,0.2)' }}>
        <h3 className="font-bold text-sm mb-3">How students pay 📱</h3>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Student opens PayLoop app', icon: '📲' },
            { step: '2', text: 'Taps "Pay" and scans this QR code', icon: '🔲' },
            { step: '3', text: 'Enters amount and confirms', icon: '✅' },
            { step: '4', text: 'Both get instant confirmation', icon: '🎉' },
          ].map(item => (
            <div key={item.step} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700 }}>
                {item.step}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm text-gray-600">{item.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 text-center">
        ⚠️ This is a <strong>demo</strong> QR code. No real money is involved. For testing only.
      </div>
    </div>
  );
}
