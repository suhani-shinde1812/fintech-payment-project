'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';

interface InsightData {
  title: string;
  content: string;
  suggestions: string[];
  topCategory: string;
  disclaimer: string;
  isMock?: boolean;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export default function AIInsightsPage() {
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: "Hi! 👋 I'm PayLoop AI. Ask me about your spending, Loop Points, or available offers. I can only access your demo activity data.\n\n⚠️ I provide educational summaries only — not financial advice." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [tab, setTab] = useState<'insights' | 'chat'>('insights');

  const loadInsights = async () => {
    setLoadingInsight(true);
    try {
      const data = await api.ai.insights() as { insight: InsightData };
      setInsight(data.insight);
    } catch {
      setInsight({
        title: '✨ Your AI Spending Insight',
        content: 'Unable to load insights. Please make some demo payments first to generate spending data.',
        suggestions: ['Make a demo payment', 'Explore student offers', 'Set a savings goal'],
        topCategory: 'General',
        disclaimer: '⚠️ Educational summary only. Not financial advice.',
        isMock: true
      });
    } finally {
      setLoadingInsight(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);

    try {
      const data = await api.ai.chat(msg) as { reply: string };
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const exampleQuestions = [
    "Where did I spend the most?",
    "How many Loop Points do I have?",
    "How can I save more?",
    "What offers are available?"
  ];

  return (
    <div className="space-y-4 animate-fadeInUp">
      <div>
        <h1 className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Insights</h1>
        <p className="text-gray-500 text-sm">Personalized spending analysis · Educational only</p>
      </div>

      {/* Demo disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
        🤖 <strong>PayLoop AI</strong> analyzes your demo spending patterns. This is educational only — not regulated financial advice.
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {[
          { key: 'insights', label: '✨ Insights' },
          { key: 'chat', label: '💬 Ask AI' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Insights tab ───────────────────────────────────────────────── */}
      {tab === 'insights' && (
        <div className="space-y-4">
          {!insight ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✨</div>
              <h3 className="font-bold text-lg mb-2">Get Your Spending Insight</h3>
              <p className="text-gray-500 text-sm mb-6">Click below to generate a personalized AI analysis of your demo spending patterns.</p>
              <button
                onClick={loadInsights}
                disabled={loadingInsight}
                className="pl-btn-primary"
              >
                {loadingInsight ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                    </svg>
                    Analyzing...
                  </span>
                ) : '✨ Generate Insight'}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeInUp">
              {/* Insight card */}
              <div className="pl-card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))', borderColor: 'rgba(99,102,241,0.2)' }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl flex-shrink-0">✨</div>
                  <div>
                    <h3 className="font-bold">{insight.title}</h3>
                    {insight.isMock && (
                      <span className="pl-badge bg-orange-100 text-orange-600 text-xs">Demo Mode</span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                  {insight.content}
                </div>
                {insight.suggestions && insight.suggestions.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Suggestions</p>
                    <div className="space-y-2">
                      {insight.suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-indigo-500 mt-0.5 flex-shrink-0">💡</span>
                          <span className="text-gray-600">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-orange-600">{insight.disclaimer}</p>
                </div>
              </div>

              <button onClick={loadInsights} disabled={loadingInsight} className="pl-btn-secondary w-full justify-center py-3 text-sm">
                🔄 Refresh Insights
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Chat tab ───────────────────────────────────────────────────── */}
      {tab === 'chat' && (
        <div className="space-y-4">
          {/* Chat messages */}
          <div className="pl-card p-4 space-y-4 max-h-96 overflow-y-auto" id="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5">
                    ✨
                  </div>
                )}
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm mr-2 flex-shrink-0">✨</div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Example questions */}
          {messages.length <= 1 && (
            <div>
              <p className="text-xs text-gray-400 font-medium mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {exampleQuestions.map(q => (
                  <button
                    key={q}
                    onClick={() => setChatInput(q)}
                    className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-200 hover:bg-indigo-100 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat input */}
          <div className="flex gap-2">
            <input
              type="text"
              className="pl-input flex-1"
              placeholder="Ask about your spending..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
            />
            <button
              onClick={sendChat}
              disabled={!chatInput.trim() || chatLoading}
              className="pl-btn-primary py-2 px-4 text-sm flex-shrink-0"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center">
            ⚠️ AI responses are based on your demo data only. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
