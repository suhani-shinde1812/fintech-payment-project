'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/merchant/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/merchant/qr', icon: '🔲', label: 'QR Code' },
  { href: '/merchant/offers', icon: '🎯', label: 'Offers' },
  { href: '/merchant/analytics', icon: '📈', label: 'Analytics' },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    else if (!loading && user && user.role !== 'MERCHANT') {
      if (user.role === 'STUDENT') router.push('/student/dashboard');
      else router.push('/admin');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="pl-skeleton w-12 h-12 rounded-2xl" /></div>;
  }

  if (!user || user.role !== 'MERCHANT') return null;

  const isPending = user.merchantProfile?.status === 'PENDING';

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Sidebar for desktop, top bar for mobile */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r" style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}>
          <div className="p-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <span className="text-white font-black text-xs">PL</span>
              </div>
              <span className="font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>PayLoop</span>
            </div>
            <p className="text-xs text-gray-400 font-medium">Merchant Portal</p>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{user.merchantProfile?.businessName || user.name}</div>
                <div className="text-xs text-gray-400 truncate">{user.email}</div>
              </div>
            </div>
            <button
              onClick={() => { localStorage.removeItem('pl_token'); window.location.href = '/login'; }}
              className="w-full text-left text-xs text-gray-400 hover:text-red-500 transition-colors px-1 py-1"
            >
              🚪 Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b" style={{ borderColor: 'var(--card-border)' }}>
            <div className="px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <span className="text-white font-black text-xs">PL</span>
                </div>
                <span className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Merchant Portal</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                {user.name.charAt(0)}
              </div>
            </div>
            {/* Mobile nav tabs */}
            <div className="flex border-t" style={{ borderColor: 'var(--card-border)' }}>
              {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex-1 flex flex-col items-center py-2 text-xs font-semibold transition-colors ${
                      isActive ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'
                    }`}>
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </header>

          {/* Pending approval notice */}
          {isPending && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-700 text-center">
              ⏳ Your merchant account is pending admin approval. Limited access.
            </div>
          )}

          {/* Demo banner */}
          <div className="px-4 py-2 text-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(90deg, #f97316, #ef4444)' }}>
            ⚠️ DEMO MERCHANT PORTAL · All transactions are simulated
          </div>

          <main className="flex-1 p-4 lg:p-8 max-w-4xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
