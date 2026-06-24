import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import Icon from '../components/Icon';

const BG     = '#F6F4F1';
const CARD   = '#FFFFFF';
const DEEP   = '#E4DED2';
const ACCENT = '#F95C4B';
const TEXT   = '#000000';
const MUTED  = '#6B6862';
const DIM    = '#9C988F';
const BORDER = '#E4DED2';

export default function Insights() {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.getInsights()
      .then(setSummary)
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
    setMessages(prev => [...prev, { role: 'user', text }]);
    setSending(true);
    try {
      const { reply } = await api.chat(text);
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${e.message}` }]);
    } finally {
      setSending(false);
    }
  };

  const regenerate = () => {
    setLoadingSummary(true);
    setSummary(null);
    setExpanded(false);
    api.getInsights()
      .then(setSummary)
      .catch((err) => setSummary({ error: err.message }))
      .finally(() => setLoadingSummary(false));
  };

  // Parse summary into first paragraph + rest
  const firstPara = summary?.summary
    ? (summary.summary.split('\n\n')[0] || summary.summary.split('\n')[0] || summary.summary)
    : '';
  const hasMore = summary?.summary && summary.summary.length > firstPara.length + 2;

  return (
    <div className="px-4 pb-4 space-y-5" style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TEXT }}>Insights</h1>
          <p className="text-sm" style={{ color: MUTED }}>AI weekly summary + chat</p>
        </div>
        <button
          onClick={regenerate}
          className="text-xs px-3 py-1.5 rounded-xl"
          style={{ color: ACCENT, background: 'rgba(170,116,82,0.15)', border: `1px solid rgba(170,116,82,0.3)` }}
        >
          Refresh
        </button>
      </div>

      {/* Weekly summary — collapsible */}
      <div className="rounded-2xl p-4" style={{ background: CARD }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: MUTED }}>Weekly Summary</p>

        {loadingSummary ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: ACCENT, borderTopColor: 'transparent' }} />
            Generating with Claude…
          </div>
        ) : summary?.error ? (
          <div className="text-sm" style={{ color: '#C46A6A' }}>
            {summary.error.includes('API') || summary.error.includes('key')
              ? 'Add your ANTHROPIC_API_KEY to .env to enable AI insights.'
              : summary.error}
          </div>
        ) : summary?.summary ? (
          <div className="text-sm leading-relaxed" style={{ color: TEXT }}>
            {/* Always show first paragraph */}
            <Markdown text={firstPara} />

            {/* Rest shown when expanded */}
            {expanded && hasMore && (
              <div className="mt-3">
                <Markdown text={summary.summary.slice(firstPara.length).trimStart()} />
              </div>
            )}

            {/* Toggle */}
            {hasMore && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="mt-3 text-xs font-medium flex items-center gap-1"
                style={{ color: ACCENT }}
              >
                {expanded ? 'Show less' : 'Read more'}
                <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={13}
                  style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
              </button>
            )}

            <p className="text-[10px] mt-3" style={{ color: DIM }}>
              {summary.from_cache ? 'Cached' : 'Fresh'} · Week of {summary.week_start}
            </p>
          </div>
        ) : (
          <p className="text-sm" style={{ color: MUTED }}>No data yet — sync some health metrics first.</p>
        )}
      </div>

      {/* Chat */}
      <div className="rounded-2xl overflow-hidden" style={{ background: CARD }}>
        <div className="px-4 pt-4 pb-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Ask your health coach</p>
        </div>

        <div className="px-4 py-3 space-y-3 max-h-72 overflow-y-auto">
          {messages.length === 0 && (
            <div className="space-y-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s)}
                  className="w-full text-left text-xs px-3 py-2 rounded-xl active:opacity-60"
                  style={{ color: MUTED, background: DEEP }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
                style={msg.role === 'user'
                  ? { background: ACCENT, color: BG, borderBottomRightRadius: 4 }
                  : { background: DEEP, color: TEXT, borderBottomLeftRadius: 4 }}
              >
                {msg.role === 'ai' ? <Markdown text={msg.text} /> : msg.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm px-4 py-2" style={{ background: DEEP }}>
                <div className="flex gap-1">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: MUTED, animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-3 pb-3 pt-2 flex gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about your health data…"
            className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: DEEP, color: TEXT, border: `1px solid ${BORDER}` }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 active:opacity-70"
            style={{ background: ACCENT, color: BG }}
          >
            <Icon name="send" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Markdown({ text }) {
  return (
    <>
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) return <p key={i} className="font-bold mt-2" style={{ color: TEXT }}>{line.slice(3)}</p>;
        if (line.startsWith('# '))  return <p key={i} className="font-bold mt-2" style={{ color: TEXT }}>{line.slice(2)}</p>;
        if (line.startsWith('- ') || line.startsWith('• '))
          return <p key={i} className="pl-3 before:content-['·'] before:mr-2">{renderBold(line.slice(2))}</p>;
        if (line.match(/^\d+\./)) return <p key={i} className="pl-3">{renderBold(line)}</p>;
        if (line === '') return <br key={i} />;
        return <p key={i}>{renderBold(line)}</p>;
      })}
    </>
  );
}

function renderBold(text) {
  return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold" style={{ color: TEXT }}>{part}</strong> : part
  );
}

const SUGGESTIONS = [
  'How was my sleep this week?',
  'What does my activity level look like?',
  'Is my HRV improving or declining?',
  'Am I meditating consistently?',
];
