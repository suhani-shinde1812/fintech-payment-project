'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function useRequireRole(roles: Array<'STUDENT' | 'MERCHANT' | 'ADMIN'>) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!roles.includes(user.role)) {
        if (user.role === 'STUDENT') router.push('/student/dashboard');
        else if (user.role === 'MERCHANT') router.push('/merchant/dashboard');
        else router.push('/admin');
      }
    }
  }, [user, loading, router, roles]);

  return { user, loading };
}
