import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PayLoop — Pay. Earn. Save.',
  description: 'Your everyday student payment companion. Discover local deals, split bills, earn rewards, and understand where your money goes.',
};

const stats = [
  { value: '10K+', label: 'Students', icon: '🎓' },
  { value: '250+', label: 'Merchants', icon: '🏪' },
  { value: '50K+', label: 'Rewards Earned', icon: '🎁' },
  { value: '₹12L+', label: 'Savings', icon: '💰' },
];

const features = [
  { icon: '✨', title: 'Smart Rewards', desc: 'Earn Loop Points on every purchase. Level up and unlock exclusive rewards.' },
  { icon: '🎯', title: 'Student Offers', desc: 'Discover verified deals from 250+ campus merchants. Save every time you pay.' },
  { icon: '⚖️', title: 'Bill Splitting', desc: 'Split bills equally or custom with friends. Settle up in seconds.' },
  { icon: '📊', title: 'Expense Tracking', desc: 'Visualize your spending with beautiful charts. Know where your money goes.' },
  { icon: '🤖', title: 'AI Insights', desc: 'Get personalized spending summaries powered by AI. Educational insights, not financial advice.' },
  { icon: '🏆', title: 'Merchant Rewards', desc: 'Participate in merchant loyalty programs. Buy 5 coffees, get 1 free!' },
];

const steps = [
  { num: '01', title: 'Pay', desc: 'Scan QR or enter merchant ID for instant demo payment', color: 'from-indigo-500 to-violet-500' },
  { num: '02', title: 'Earn', desc: 'Get Loop Points on every eligible transaction', color: 'from-violet-500 to-purple-500' },
  { num: '03', title: 'Save', desc: 'Track spending, set goals, see your savings grow', color: 'from-purple-500 to-pink-500' },
  { num: '04', title: 'Discover', desc: 'Find student offers from local and campus merchants', color: 'from-pink-500 to-rose-500' },
];

const testimonials = [
  { name: 'Suhani M.', college: 'RVCE Bengaluru, 3rd Year', text: 'PayLoop helped me realize I was spending ₹4,000 a month on food alone. The AI insights are actually useful!', avatar: '🎓', points: '2,840 points earned' },
  { name: 'Aryan K.', college: 'IIT Bombay, 2nd Year', text: 'The bill splitting feature saved my friendships 😂 No more awkward conversations about who owes what.', avatar: '👨‍💻', points: '1,560 points earned' },
  { name: 'Priya S.', college: 'Delhi University, MBA', text: 'I redeemed my Loop Points for a free coffee coupon. Felt really rewarding to get something back!', avatar: '☕', points: '3,210 points earned' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen hero-gradient">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <span className="text-white font-bold text-sm">PL</span>
            </div>
            <span className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              PayLoop
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</Link>
            <Link href="#testimonials" className="hover:text-indigo-600 transition-colors">Stories</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">Log In</Link>
            <Link href="/signup" className="pl-btn-primary text-sm py-2 px-4">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 pl-badge pl-badge-primary mb-6 text-sm">
          <span>🎓</span>
          <span>Built for Students · Demo Mode · No Real Money</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          <span className="gradient-text">Pay. Earn. Save.</span>
          <br />
          <span className="text-gray-900">Your campus</span>
          <br />
          <span className="text-gray-900">money companion.</span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Discover local deals, split bills instantly, earn Loop Points on every purchase,
          and get AI-powered insights into where your money goes.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="pl-btn-primary text-base py-4 px-8">
            <span>🚀</span> Get Started Free
          </Link>
          <Link href="/student/offers" className="pl-btn-secondary text-base py-4 px-8">
            <span>🎯</span> Explore Offers
          </Link>
        </div>

        {/* Demo warning banner */}
        <div className="mt-8 inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2 text-sm text-orange-700">
          <span>⚠️</span>
          <span><strong>DEMO SYSTEM</strong> — No real money is moved. All payments are simulated.</span>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="pl-card text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="pl-stat-value">{stat.value}</div>
              <div className="pl-stat-label">{stat.label}</div>
              <div className="text-xs text-orange-500 mt-1 font-medium">Sample Data</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <h2 className="text-4xl font-black text-center mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          How It Works
        </h2>
        <p className="text-gray-500 text-center mb-12 text-lg">Four simple steps to a smarter campus life</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.num} className="pl-card group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                <span className="text-white font-black text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{step.num}</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <h2 className="text-4xl font-black text-center mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Everything You Need
        </h2>
        <p className="text-gray-500 text-center mb-12 text-lg">Built specifically for the student lifestyle</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="pl-card group cursor-default">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section id="testimonials" className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <h2 className="text-4xl font-black text-center mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Student Stories
        </h2>
        <p className="text-gray-500 text-center mb-4 text-lg">What our demo users say</p>
        <p className="text-xs text-orange-500 text-center mb-12 font-medium">⚠️ Fictional demo testimonials for illustration only</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="pl-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-2xl">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.college}</div>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="text-xs text-indigo-600 font-semibold">{t.points}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="pl-gradient-card text-center py-16 px-8">
          <h2 className="text-4xl font-black mb-4 text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Ready to start earning?
          </h2>
          <p className="text-white/80 mb-8 text-lg">Join thousands of students managing their campus finances smarter.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold py-3 px-8 rounded-xl hover:bg-indigo-50 transition-colors">
              <span>🎓</span> Create Student Account
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 bg-white/20 text-white font-bold py-3 px-8 rounded-xl hover:bg-white/30 transition-colors border border-white/30">
              <span>👤</span> Log In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">PL</span>
            </div>
            <span className="font-bold text-gray-900">PayLoop</span>
          </div>
          <p className="text-sm text-gray-500 text-center">
            ⚠️ <strong>DEMO SYSTEM</strong> — PayLoop Campus V1 is a simulation. No real money is moved. Not a licensed financial service.
          </p>
          <p className="text-sm text-gray-400">© 2024 PayLoop Campus</p>
        </div>
      </footer>
    </div>
  );
}
