'use client';

import { useRef, useEffect } from 'react';
import { LmsCard } from '@/app/components/lms';
import { getLmsAuthHeaders } from '@/lib/authClient';

const formatTime = (d) =>
  d ? new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '';

export default function ChatMessageList({
  messages,
  selectedRoom,
  messageText,
  setMessageText,
  handleSend,
  handleLoadOlder,
  loadingOlder,
  loadRooms,
  setSelectedRoom,
  currentUserId,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (!selectedRoom) {
    return (
      <LmsCard className="md:col-span-2 flex flex-col min-h-[400px]" hoverable={false}>
        <div className="flex-1 flex items-center justify-center">
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-400)' }}>
            Select a conversation or start a new one.
          </p>
        </div>
      </LmsCard>
    );
  }

  return (
    <LmsCard
      title={selectedRoom.displayTitle || 'Messages'}
      className="md:col-span-2 flex flex-col"
      hoverable={false}
      action={
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={async () => {
              const nextMuted = !selectedRoom.is_muted;
              await fetch(`/api/chat/rooms/${selectedRoom.id}/mute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
                body: JSON.stringify({ isMuted: nextMuted, emailMuted: selectedRoom.email_muted }),
              });
              await loadRooms();
              setSelectedRoom((prev) => prev ? { ...prev, is_muted: nextMuted } : prev);
            }}
            className="lms-btn lms-btn-sm lms-btn-outline"
          >
            {selectedRoom.is_muted ? 'Unmute' : 'Mute'}
          </button>
          <button
            type="button"
            onClick={async () => {
              const nextEmailMuted = !selectedRoom.email_muted;
              await fetch(`/api/chat/rooms/${selectedRoom.id}/mute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
                body: JSON.stringify({ isMuted: selectedRoom.is_muted, emailMuted: nextEmailMuted }),
              });
              await loadRooms();
              setSelectedRoom((prev) => prev ? { ...prev, email_muted: nextEmailMuted } : prev);
            }}
            className="lms-btn lms-btn-sm lms-btn-outline"
          >
            {selectedRoom.email_muted ? 'Email off' : 'Email on'}
          </button>
        </div>
      }
    >
      <div className="flex flex-col" style={{ height: 'clamp(350px, 55vh, 550px)' }}>
        {/* Messages area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto"
          style={{
            padding: 'var(--lms-space-4)',
            borderRadius: '8px',
            background: 'var(--neutral-50)',
            border: '1px solid var(--neutral-100)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--lms-space-3)',
          }}
        >
          {/* Load older */}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleLoadOlder}
              disabled={loadingOlder}
              className="lms-btn lms-btn-sm lms-btn-outline"
              style={{ alignSelf: 'center', marginBottom: 'var(--lms-space-2)' }}
            >
              {loadingOlder ? 'Loading...' : 'Load older messages'}
            </button>
          )}

          {messages.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--neutral-400)', textAlign: 'center', padding: 'var(--lms-space-8) 0' }}>
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((m) => {
              const isSelf = currentUserId && String(m.sender_id || m.user_id) === String(currentUserId);
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isSelf ? 'flex-end' : 'flex-start' }}>
                  <p className="lms-chat-sender">{isSelf ? 'You' : (m.first_name || m.email)}</p>
                  <div className={`lms-chat-bubble ${isSelf ? 'lms-chat-bubble-self' : 'lms-chat-bubble-other'}`}>
                    {m.body}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="lms-chat-time">{formatTime(m.created_at)}</span>
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => fetch(`/api/chat/messages/${m.id}/report`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
                          body: JSON.stringify({ reason: 'report' }),
                        })}
                        style={{ fontSize: '0.6875rem', color: 'var(--neutral-400)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Report
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', marginTop: 'var(--lms-space-4)' }}>
          <input
            type="text"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="lms-input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="lms-btn lms-btn-primary" disabled={!messageText.trim()}>
            Send
          </button>
        </form>
      </div>
    </LmsCard>
  );
}
