import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'PayLoop — Pay. Earn. Save.',
    template: '%s | PayLoop'
  },
  description: 'PayLoop Campus — Your everyday student payment companion. Discover local deals, split bills, earn rewards, and understand where your money goes.',
  keywords: ['student payments', 'rewards', 'student offers', 'expense tracking', 'bill splitting'],
  openGraph: {
    title: 'PayLoop — Pay. Earn. Save.',
    description: 'Student-focused payments, rewards, and local offers platform',
    type: 'website',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                style: {
                  background: '#10b981',
                  color: 'white',
                },
                iconTheme: { primary: 'white', secondary: '#10b981' }
              },
              error: {
                style: {
                  background: '#ef4444',
                  color: 'white',
                },
              }
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
