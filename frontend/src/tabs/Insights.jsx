import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';

export default function Insights() {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.getInsights()
      .then((data) => setSummary(data))
      .catch((err) => setSummary({ error: err.message }))
      .finally(() => setLoadingSummary(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setSending(true);
    try {
      const { reply } = await api.chat(text);
      setMessages((prev) => [...prev, { role: 'ai', text: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'ai', text: `Error: ${e.message}` }]);
    } finally {
      setSending(false);
    }
  };

  const regenerate = () => {
    setLoadingSummary(true);
    setSummary(null);
    // Force fresh by hitting the API (cache busts after 7 days naturally — for now just refetch)
    api.getInsights()
      .then(setSummary)
      .catch((err) => setSummary({ error: err.message }))
      .finally(() => setLoadingSummary(false));
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Insights ✨</h1>
          <p className="text-sm text-slate-400">AI weekly summary + chat</p>
        </div>
        <button
          onClick={regenerate}
          className="text-xs text-indigo-400 bg-indigo-950 border border-indigo-800 px-3 py-1.5 rounded-xl"
        >
          Refresh
        </button>
      </div>

      {/* Weekly summary */}
      <div className="bg-[#1e293b] rounded-2xl p-4">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">Weekly Summary</p>
        {loadingSummary ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            Generating with Claude…
          </div>
        ) : summary?.error ? (
          <div className="text-sm text-rose-400">
            {summary.error.includes('API') || summary.error.includes('key')
              ? 'Add your ANTHROPIC_API_KEY to .env to enable AI insights.'
              : summary.error}
          </div>
        ) : summary?.summary ? (
          <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap prose-sm">
            <Markdown text={summary.summary} />
            <p className="text-[10px] text-slate-500 mt-3">
              {summary.from_cache ? '📦 Cached' : '🤖 Fresh'} · Week of {summary.week_start}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No data yet — sync some health metrics first.</p>
        )}
      </div>

      {/* Chat */}
      <div className="bg-[#1e293b] rounded-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-2 border-b border-slate-700">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Ask your health coach</p>
        </div>

        <div className="px-4 py-3 space-y-3 max-h-80 overflow-y-auto">
          {messages.length === 0 && (
            <div className="space-y-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); }}
                  className="w-full text-left text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-slate-700 text-slate-100 rounded-bl-sm'}`}>
                {msg.role === 'ai' ? <Markdown text={msg.text} /> : msg.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-3 pb-3 pt-2 flex gap-2 border-t border-slate-700">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about your health data…"
            className="flex-1 bg-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none border border-slate-700 focus:border-indigo-500"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-9 h-9 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Minimal markdown renderer — bold, bullet points
function Markdown({ text }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <p key={i} className="font-bold text-slate-100 mt-2">{line.slice(3)}</p>;
        if (line.startsWith('# ')) return <p key={i} className="font-bold text-slate-100 mt-2">{line.slice(2)}</p>;
        if (line.startsWith('- ') || line.startsWith('• ')) return <p key={i} className="pl-3 before:content-['•'] before:mr-2 before:text-indigo-400">{renderBold(line.slice(2))}</p>;
        if (line.match(/^\d+\./)) return <p key={i} className="pl-3">{renderBold(line)}</p>;
        if (line === '') return <br key={i} />;
        return <p key={i}>{renderBold(line)}</p>;
      })}
    </>
  );
}

function renderBold(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-slate-100 font-semibold">{part}</strong> : part
  );
}

const SUGGESTIONS = [
  '💤 How was my sleep this week?',
  '🏃 What does my activity level look like?',
  '💓 Is my HRV improving or declining?',
  '🧘 Am I meditating consistently?',
];
