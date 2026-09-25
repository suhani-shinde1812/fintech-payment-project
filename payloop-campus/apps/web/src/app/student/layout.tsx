'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/layout/BottomNav';
import Link from 'next/link';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && user.role !== 'STUDENT') {
      if (user.role === 'MERCHANT') router.push('/merchant/dashboard');
      else router.push('/admin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <span className="text-white font-black text-xl">PL</span>
          </div>
          <div className="pl-skeleton h-4 w-24 mx-auto rounded-full" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'STUDENT') return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-gray-100" style={{ borderColor: 'var(--card-border)' }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/student/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <span className="text-white font-black text-xs">PL</span>
            </div>
            <span className="font-bold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>PayLoop</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/student/ai-insights" className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base hover:bg-gray-200 transition-colors" aria-label="AI Insights">✨</Link>
            <Link href="/student/savings" className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base hover:bg-gray-200 transition-colors" aria-label="Savings">🎯</Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 pt-4 with-bottom-nav">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
