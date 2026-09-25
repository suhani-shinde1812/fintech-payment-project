'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const userData = JSON.parse(localStorage.getItem('pl_user') || '{}');
      toast.success('Welcome back! 👋');
      // Small delay to read user role from context
      setTimeout(() => {
        const token = localStorage.getItem('pl_token');
        if (token) {
          // Decode role from JWT payload (no verification, just decode)
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role === 'STUDENT') router.push('/student/dashboard');
            else if (payload.role === 'MERCHANT') router.push('/merchant/dashboard');
            else router.push('/admin');
          } catch {
            router.push('/student/dashboard');
          }
        }
      }, 100);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: string) => {
    const accounts: Record<string, { email: string; password: string }> = {
      student: { email: 'student@payloop.demo', password: 'Demo@123456' },
      merchant: { email: 'merchant@payloop.demo', password: 'Demo@123456' },
      admin: { email: 'admin@payloop.demo', password: 'Demo@123456' },
    };
    const acc = accounts[role];
    if (acc) {
      setEmail(acc.email);
      setPassword(acc.password);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <span className="text-white font-black text-lg">PL</span>
        </div>
        <span className="text-2xl font-black gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>PayLoop</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="pl-card p-8">
          <h1 className="text-2xl font-black mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Welcome back</h1>
          <p className="text-gray-500 text-sm mb-6">Sign in to your PayLoop account</p>

          {/* Demo shortcuts */}
          <div className="mb-6">
            <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Quick Demo Login</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { role: 'student', label: '🎓 Student', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
                { role: 'merchant', label: '🏪 Merchant', color: 'bg-violet-50 text-violet-600 border-violet-200' },
                { role: 'admin', label: '⚙️ Admin', color: 'bg-gray-50 text-gray-600 border-gray-200' },
              ].map(d => (
                <button
                  key={d.role}
                  onClick={() => fillDemo(d.role)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:scale-105 ${d.color}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-input"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-input pr-12"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="pl-btn-primary w-full justify-center py-3"
              id="login-submit"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-indigo-600 font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          ⚠️ Demo accounts use password: <code className="bg-gray-100 px-1 rounded">Demo@123456</code>
        </p>
      </div>
    </div>
  );
}
