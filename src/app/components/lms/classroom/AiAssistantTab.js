'use client';

import { useEffect, useState, useRef } from 'react';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';

const STARTER_QUESTIONS = [
  'Explain this week\'s concept in simple terms',
  'Give me a hint without giving away the answer',
  'What are the key takeaways I should remember?',
  'Break this down into steps I can follow',
];

export default function AiAssistantTab({ contextWeekId }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useWeekContext, setUseWeekContext] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    const load = async () => {
      const headers = getLmsAuthHeaders();
      const convRes = await fetch('/api/ai/conversations', { headers });
      const convData = await convRes.json();
      if (convRes.ok && convData.conversations?.length) {
        const cId = convData.conversations[0].id;
        setConversationId(cId);
        const msgRes = await fetch(`/api/ai/conversations/${cId}`, { headers });
        const msgData = await msgRes.json();
        if (msgData?.messages) setMessages(msgData.messages);
      }
    };
    load();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
      body: JSON.stringify({
        message: userMessage,
        conversationId,
        weekId: useWeekContext ? contextWeekId : null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      if (!conversationId && data.conversationId) setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } else {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.error || 'Unable to respond right now.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col">
      {/* Context toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--neutral-200)' }}>
        <label className="lms-checkbox-label">
          <input
            type="checkbox"
            checked={useWeekContext}
            onChange={(e) => setUseWeekContext(e.target.checked)}
          />
          Use current week context
        </label>
      </div>

      {/* Chat container */}
      <div className="ai-chat-container" style={{ height: 'clamp(280px, 50vh, 420px)', overflowY: 'auto', overflowX: 'hidden', borderRadius: '12px', border: '2px solid var(--neutral-300)', background: 'var(--neutral-50)', padding: 'var(--lms-space-5)', scrollBehavior: 'smooth' }}>
        {messages.length === 0 && !loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--primary-color) 10%, transparent)', color: 'var(--primary-color)', marginBottom: '1.25rem' }}>
              {LmsIcons.sparkle}
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--neutral-800)', margin: '0 0 0.5rem' }}>Start a conversation</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', maxWidth: '20rem', margin: '0 0 1rem' }}>
              Ask questions about your course content, get hints on assignments, or request explanations.
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-500)', margin: '0 0 1.25rem' }}>Try a prompt below or type your own.</p>
            <div className="ai-starter-grid">
              {STARTER_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInput(q)}
                  className="ai-starter-btn"
                  style={{
                    textAlign: 'left',
                    padding: 'var(--lms-space-3) var(--lms-space-4)',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    color: 'var(--neutral-700)',
                    background: 'var(--neutral-100)',
                    border: '2px solid var(--neutral-300)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {messages.map((m, idx) => {
              const prevSame = idx > 0 && messages[idx - 1].role === m.role;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                    marginTop: idx === 0 ? 0 : prevSame ? '2px' : 'var(--lms-space-3)',
                  }}
                >
                  {m.role === 'assistant' && (
                    <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--primary-color) 15%, transparent)', color: 'var(--primary-color)' }}>
                      {LmsIcons.sparkle}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '80%',
                    padding: '0.75rem 1rem',
                    borderRadius: '1rem',
                    boxShadow: 'var(--shadow-sm)',
                    background: m.role === 'user' ? 'color-mix(in srgb, var(--primary-color) 18%, transparent)' : 'var(--neutral-100)',
                    color: 'var(--text-color)',
                  }}>
                    <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', margin: 0 }}>{m.content}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '0.5rem', marginBottom: 0 }}>just now</p>
                  </div>
                  {m.role === 'user' && (
                    <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--primary-color) 20%, transparent)', color: 'var(--primary-color)' }}>
                      {LmsIcons.users}
                    </div>
                  )}
                </div>
              );
            })}
            {loading && (
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-start', marginTop: 'var(--lms-space-3)' }}>
                <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--primary-color) 15%, transparent)', color: 'var(--primary-color)' }}>
                  {LmsIcons.sparkle}
                </div>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '1rem', background: 'var(--neutral-100)', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="ai-typing-dots" style={{ display: 'flex', gap: 6, padding: '4px 0' }}>
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--neutral-200)', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="lms-input"
          style={{ flex: 1, minWidth: 0 }}
        />
        <button type="submit" disabled={loading} className="lms-btn lms-btn-primary">
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </form>

      <style jsx>{`
        .ai-typing-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--neutral-400);
          animation: ai-typing-bounce 1.4s ease-in-out infinite both;
        }
        .ai-typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .ai-typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes ai-typing-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
