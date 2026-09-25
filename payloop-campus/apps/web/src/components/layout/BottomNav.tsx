'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/student/dashboard', icon: '🏠', label: 'Home' },
  { href: '/student/offers', icon: '🎯', label: 'Offers' },
  { href: '/student/pay', icon: '💳', label: 'Pay', isPay: true },
  { href: '/student/rewards', icon: '🎁', label: 'Rewards' },
  { href: '/student/expenses', icon: '📊', label: 'Track' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pl-bottom-nav" role="navigation" aria-label="Main navigation">
      {navItems.map(item => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        if (item.isPay) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="pl-bottom-nav-pay"
              aria-label="Scan and Pay"
              id="nav-pay-btn"
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`pl-bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
