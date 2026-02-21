'use client';

import { LmsCard } from '@/app/components/lms';
import { getLmsAuthHeaders } from '@/lib/authClient';

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
}) {
  return (
    <LmsCard title={selectedRoom?.displayTitle || 'Messages'} className="md:col-span-2 flex flex-col min-h-[400px]" hoverable={false}>
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2">
          {selectedRoom && (
            <div className="flex items-center gap-3 text-xs text-[var(--neutral-500)]">
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
                className="lms-link bg-transparent border-none cursor-pointer p-0"
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
                className="lms-link bg-transparent border-none cursor-pointer p-0"
              >
                {selectedRoom.email_muted ? 'Email off' : 'Email on'}
              </button>
            </div>
          )}
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleLoadOlder}
            disabled={loadingOlder}
            className="mt-3 text-xs lms-link self-start bg-transparent border-none cursor-pointer p-0"
          >
            {loadingOlder ? 'Loading...' : 'Load older'}
          </button>
        )}
        <div className="mt-4 flex-1 overflow-auto rounded-lg p-4 space-y-4 min-h-[200px] border border-[var(--neutral-100)] bg-[var(--neutral-50)]">
          {messages.length === 0 ? (
            <p className="text-sm text-[var(--neutral-500)]">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-[var(--neutral-500)]">
                    {m.first_name || m.email}
                  </p>
                  <button
                    type="button"
                    onClick={() => fetch(`/api/chat/messages/${m.id}/report`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
                      body: JSON.stringify({ reason: 'report' }),
                    })}
                    className="text-xs text-[var(--neutral-400)] hover:text-red-500 bg-transparent border-none cursor-pointer p-0"
                  >
                    Report
                  </button>
                </div>
                <p className="text-sm text-[var(--neutral-800)] mt-1 p-2 bg-white rounded-lg border border-[var(--neutral-100)] shadow-sm">{m.body}</p>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSend} className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Type a message"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="lms-form-input border-token flex-1 px-3 py-2 rounded-lg text-sm"
          />
          <button type="submit" className="lms-btn lms-btn-primary">
            Send
          </button>
        </form>
      </div>
    </LmsCard>
  );
}
