'use client';

import { useEffect, useState } from 'react';
import { LmsCard, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';

export default function AiAssistantPage() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextWeekId, setContextWeekId] = useState(null);
  const [useContext, setUseContext] = useState(true);

  useEffect(() => {
    const load = async () => {
      const convRes = await fetch('/api/ai/conversations', { headers: getLmsAuthHeaders() });
      const convData = await convRes.json();
      if (convRes.ok && convData.conversations?.length) {
        const conv = convData.conversations[0];
        setConversationId(conv.id);
        const msgRes = await fetch(`/api/ai/conversations/${conv.id}`, { headers: getLmsAuthHeaders() });
        const msgData = await msgRes.json();
        if (msgRes.ok && msgData.messages) setMessages(msgData.messages);
      }
      const cohortRes = await fetch('/api/cohorts', { headers: getLmsAuthHeaders() });
      const cohortData = await cohortRes.json();
      if (cohortRes.ok && cohortData.cohorts?.length) {
        const cohortId = cohortData.cohorts[0].id;
        const weeksRes = await fetch(`/api/cohorts/${cohortId}/weeks`, { headers: getLmsAuthHeaders() });
        const weeksData = await weeksRes.json();
        if (weeksRes.ok && weeksData.weeks?.length) {
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
    <div className="space-y-8">
      <LmsPageHeader title="AI Study Assistant" subtitle="Get guidance, hints, and structured explanations." icon={LmsIcons.sparkle} />

      <LmsCard title="Chat" subtitle="Ask questions about your course content" icon={LmsIcons.sparkle}>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useContext}
              onChange={(e) => setUseContext(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            Use current week context
          </label>
        </div>
        <div className="mt-4 h-[420px] overflow-auto border border-gray-100 rounded-lg p-4 space-y-4 bg-gray-50/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="mb-2">{LmsIcons.sparkle}</div>
              <p className="text-sm">Ask a question to get started.</p>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} className={m.role === 'assistant' ? 'lms-chat-assistant' : 'lms-chat-user'}>
                <p className="text-xs opacity-60 font-medium mb-1">{m.role === 'assistant' ? 'Assistant' : 'You'}</p>
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSend} className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="lms-form-input flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </form>
      </LmsCard>
    </div>
  );
}
