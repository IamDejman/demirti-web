'use client';

import { useEffect, useState, useRef } from 'react';
import { LmsCard, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';

const STARTER_QUESTIONS = [
  'Explain this week\'s concept in simple terms',
  'Give me a hint without giving away the answer',
  'What are the key takeaways I should remember?',
  'Break this down into steps I can follow',
];

export default function AiAssistantPage() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextWeekId, setContextWeekId] = useState(null);
  const [useContext, setUseContext] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    const load = async () => {
      const headers = getLmsAuthHeaders();
      const [convRes, cohortRes] = await Promise.all([
        fetch('/api/ai/conversations', { headers }),
        fetch('/api/cohorts', { headers }),
      ]);
      const [convData, cohortData] = await Promise.all([convRes.json(), cohortRes.json()]);

      const hasConv = convRes.ok && convData.conversations?.length;
      const hasCohort = cohortRes.ok && cohortData.cohorts?.length;
      if (hasConv) setConversationId(convData.conversations[0].id);

      const batch2Promises = [];
      if (hasConv) {
        batch2Promises.push(
          fetch(`/api/ai/conversations/${convData.conversations[0].id}`, { headers }).then((r) => r.json())
        );
      }
      if (hasCohort) {
        batch2Promises.push(
          fetch(`/api/cohorts/${cohortData.cohorts[0].id}/weeks`, { headers }).then((r) => r.json())
        );
      }

      if (batch2Promises.length === 0) return;
      const batch2Results = await Promise.all(batch2Promises);

      let idx = 0;
      if (hasConv) {
        const msgData = batch2Results[idx++];
        if (msgData?.messages) setMessages(msgData.messages);
      }
      if (hasCohort) {
        const weeksData = batch2Results[idx++];
        if (weeksData?.weeks?.length) {
          const currentWeek = weeksData.weeks.find((w) => !w.is_locked) || weeksData.weeks[0];
          setContextWeekId(currentWeek?.id || null);
        }
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
        weekId: useContext ? contextWeekId : null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } else {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.error || 'Unable to respond right now.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader title="AI Study Assistant" subtitle="Get guidance, hints, and structured explanations." icon={LmsIcons.sparkle} />

      <LmsCard title="Chat" subtitle="Ask questions about your course content" icon={LmsIcons.sparkle}>
        <div className="ai-chat-card-body flex flex-col">
          <div className="ai-chat-context-row flex items-center gap-3 text-sm text-[var(--neutral-600)] mb-4 pb-4 border-b border-[var(--neutral-200)]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useContext}
                onChange={(e) => setUseContext(e.target.checked)}
                className="rounded border-2 border-[var(--neutral-300)] text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
              />
              Use current week context
            </label>
          </div>
          <div className="ai-chat-container h-[420px] overflow-y-auto overflow-x-hidden rounded-xl border-2 border-[var(--neutral-300)] bg-[var(--neutral-50)]">
          {messages.length === 0 && !loading ? (
            <div className="ai-chat-empty flex flex-col items-center justify-center h-full text-center px-6 py-8">
              <div className="ai-chat-empty-icon mb-5">
                {LmsIcons.sparkle}
              </div>
              <h3 className="ai-chat-empty-title">Start a conversation</h3>
              <p className="ai-chat-empty-desc">
                Ask questions about your course content, get hints on assignments, or request explanations tailored to your learning style.
              </p>
              <p className="ai-chat-empty-hint">Try a prompt below or type your own.</p>
              <div className="ai-chat-starters">
                {STARTER_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInput(q)}
                    className="ai-starter-btn"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ai-chat-messages flex flex-col">
              {messages.map((m, idx) => {
                const prevSame = idx > 0 && messages[idx - 1].role === m.role;
                return (
                  <div
                    key={idx}
                    className={`ai-message-row flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'} ${idx > 0 ? (prevSame ? 'ai-message-grouped' : 'ai-message-spaced') : ''}`}
                  >
                    {m.role === 'assistant' && (
                      <div className="ai-avatar ai-avatar-assistant shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[color:color-mix(in_srgb,var(--primary-color)_15%,transparent)] text-[var(--primary-color)]">
                        {LmsIcons.sparkle}
                      </div>
                    )}
                    <div
                      className={`ai-bubble max-w-[80%] px-4 py-3 rounded-2xl shadow-[var(--shadow-sm)] ${
                        m.role === 'user'
                          ? 'bg-[color:color-mix(in_srgb,var(--primary-color)_18%,transparent)] text-[var(--text-color)]'
                          : 'bg-[var(--neutral-100)] text-[var(--text-color)]'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      <p className="text-xs text-[var(--neutral-500)] mt-2">just now</p>
                    </div>
                    {m.role === 'user' && (
                      <div className="ai-avatar ai-avatar-user shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[color:color-mix(in_srgb,var(--primary-color)_20%,transparent)] text-[var(--primary-color)]">
                        {LmsIcons.users}
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && (
                <div className="ai-message-row ai-message-spaced flex gap-3 justify-start">
                  <div className="ai-avatar ai-avatar-assistant shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[color:color-mix(in_srgb,var(--primary-color)_15%,transparent)] text-[var(--primary-color)]">
                    {LmsIcons.sparkle}
                  </div>
                  <div className="ai-bubble ai-typing px-4 py-3 rounded-2xl bg-[var(--neutral-100)] shadow-[var(--shadow-sm)]">
                    <div className="ai-typing-dots">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
        <form onSubmit={handleSend} className="ai-chat-form mt-5 pt-5 border-t border-[var(--neutral-200)] flex gap-3">
          <input
            type="text"
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="lms-form-input border-token flex-1 min-w-0 px-4 py-2.5 rounded-xl text-sm"
          />
          <button type="submit" disabled={loading} className="lms-btn lms-btn-primary ai-chat-send-btn">
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </form>
        </div>
      </LmsCard>
      <style jsx>{`
        .ai-chat-container {
          scroll-behavior: smooth;
          padding: var(--lms-space-5);
        }
        .ai-chat-form {
          flex-wrap: wrap;
        }
        .ai-chat-send-btn {
          border: 2px solid color-mix(in srgb, var(--primary-color) 85%, #000);
          padding: 0.5rem 1.25rem;
          border-radius: 12px;
          min-height: 2.75rem;
        }
        .ai-chat-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--primary-color) 10%, transparent);
          color: var(--primary-color);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--primary-color) 18%, transparent);
        }
        .ai-chat-empty-icon :global(svg) {
          width: 32px;
          height: 32px;
        }
        .ai-chat-empty-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--neutral-800);
          margin: 0 0 var(--lms-space-2);
          letter-spacing: -0.01em;
        }
        .ai-chat-empty-desc {
          font-size: 0.875rem;
          line-height: 1.5;
          color: var(--neutral-600);
          margin: 0 0 var(--lms-space-4);
          max-width: 20rem;
        }
        .ai-chat-empty-hint {
          font-size: 0.8125rem;
          color: var(--neutral-500);
          margin: 0 0 var(--lms-space-5);
        }
        .ai-chat-starters {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--lms-space-3);
          max-width: 28rem;
          width: 100%;
        }
        .ai-starter-btn {
          text-align: left;
          padding: var(--lms-space-3) var(--lms-space-4);
          border-radius: 12px;
          font-size: 0.875rem;
          color: var(--neutral-700);
          background: var(--neutral-100);
          border: 2px solid var(--neutral-300);
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
        }
        .ai-starter-btn:hover {
          background: color-mix(in srgb, var(--primary-color) 8%, var(--neutral-100));
          border-color: color-mix(in srgb, var(--primary-color) 25%, var(--neutral-200));
          color: var(--neutral-800);
        }
        .ai-starter-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px var(--neutral-100), 0 0 0 4px var(--primary-color);
        }
        .ai-avatar :global(svg) {
          width: 16px;
          height: 16px;
        }
        .ai-message-spaced {
          margin-top: var(--lms-space-3);
        }
        .ai-message-grouped {
          margin-top: 2px;
        }
        .ai-typing-dots {
          display: flex;
          gap: 6px;
          padding: 4px 0;
        }
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
