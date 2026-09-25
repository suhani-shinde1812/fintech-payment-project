'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { ApiError } from '@/lib/api';

type Role = 'STUDENT' | 'MERCHANT';

export default function SignupPage() {
  const [role, setRole] = useState<Role>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    college: '', course: '', year: '2',
    businessName: '', address: '', phone: '', categoryId: ''
  });

  const { register } = useAuth();
  const router = useRouter();

  const updateForm = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        role,
      };

      if (role === 'STUDENT') {
        payload.college = form.college;
        payload.course = form.course;
        payload.year = parseInt(form.year);
      } else {
        payload.businessName = form.businessName;
        payload.address = form.address;
        payload.phone = form.phone;
      }

      await register(payload);
      toast.success('Account created! Welcome to PayLoop 🎉');
      if (role === 'STUDENT') router.push('/student/dashboard');
      else router.push('/merchant/dashboard');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <span className="text-white font-black text-lg">PL</span>
        </div>
        <span className="text-2xl font-black gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>PayLoop</span>
      </Link>

      <div className="w-full max-w-lg">
        <div className="pl-card p-8">
          <h1 className="text-2xl font-black mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Create account</h1>
          <p className="text-gray-500 text-sm mb-6">Join PayLoop Campus — it&apos;s free</p>

          {/* Role Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
            {(['STUDENT', 'MERCHANT'] as Role[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  role === r
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r === 'STUDENT' ? '🎓 Student' : '🏪 Merchant'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common fields */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Full Name</label>
                <input
                  type="text"
                  className="pl-input"
                  placeholder="Suhani Mehta"
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Email</label>
                <input
                  type="email"
                  className="pl-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => updateForm('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Password</label>
                <input
                  type="password"
                  className="pl-input"
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  value={form.password}
                  onChange={e => updateForm('password', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  className="pl-input"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={e => updateForm('confirmPassword', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Student-specific */}
            {role === 'STUDENT' && (
              <div className="space-y-4 pt-2">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Student Details</div>
                <input
                  type="text"
                  className="pl-input"
                  placeholder="College / University"
                  value={form.college}
                  onChange={e => updateForm('college', e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="pl-input"
                  placeholder="Course (e.g. B.Tech CSE)"
                  value={form.course}
                  onChange={e => updateForm('course', e.target.value)}
                  required
                />
                <select
                  className="pl-input"
                  value={form.year}
                  onChange={e => updateForm('year', e.target.value)}
                  required
                >
                  {[1, 2, 3, 4, 5, 6].map(y => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Merchant-specific */}
            {role === 'MERCHANT' && (
              <div className="space-y-4 pt-2">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Business Details</div>
                <input
                  type="text"
                  className="pl-input"
                  placeholder="Business Name"
                  value={form.businessName}
                  onChange={e => updateForm('businessName', e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="pl-input"
                  placeholder="Business Address"
                  value={form.address}
                  onChange={e => updateForm('address', e.target.value)}
                  required
                />
                <input
                  type="tel"
                  className="pl-input"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={e => updateForm('phone', e.target.value)}
                  required
                />
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
                  ⏳ Merchant accounts require admin approval before going live.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="pl-btn-primary w-full justify-center py-3 mt-2"
              id="signup-submit"
            >
              {loading ? 'Creating account...' : `Create ${role === 'STUDENT' ? 'Student' : 'Merchant'} Account`}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 font-semibold hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
