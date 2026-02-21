'use client';

import { LmsCard } from '@/app/components/lms';

export default function ChatRoomList({
  rooms,
  selectedRoom,
  setSelectedRoom,
  roomFilter,
  setRoomFilter,
  dmEmail,
  setDmEmail,
  userSearch,
  setUserSearch,
  userResults,
  handleCreateDm,
  handleCreateDmWithUser,
}) {
  return (
    <LmsCard title="Rooms" className="md:col-span-1">
      <form onSubmit={handleCreateDm} className="space-y-2">
        <input
          type="email"
          placeholder="Start DM with email"
          value={dmEmail}
          onChange={(e) => setDmEmail(e.target.value)}
          className="lms-form-input border-token w-full px-3 py-2 rounded-lg text-sm"
        />
        <button type="submit" className="lms-btn lms-btn-primary w-full">
          Start DM
        </button>
      </form>
      <div className="mt-4">
        <input
          type="text"
          placeholder="Search rooms"
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="lms-form-input border-token w-full px-3 py-2 rounded-lg text-sm"
        />
      </div>
      <div className="mt-3">
        <input
          type="text"
          placeholder="Find user by name/email"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          className="lms-form-input border-token w-full px-3 py-2 rounded-lg text-sm"
        />
        {userResults.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm">
            {userResults.map((u) => (
              <li key={u.id} className="flex items-center justify-between rounded-lg px-2 py-1 bg-[var(--neutral-50)]">
                <span className="text-[var(--neutral-900)]">{u.first_name || ''} {u.last_name || ''} · {u.email}</span>
                <button
                  type="button"
                  onClick={() => handleCreateDmWithUser(u.id)}
                  className="lms-link text-xs font-medium bg-transparent border-none cursor-pointer p-0"
                >
                  DM
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ul className="mt-4 space-y-2">
        {rooms.length === 0 ? (
          <li className="text-sm text-[var(--neutral-500)]">No rooms yet.</li>
        ) : (
          rooms
            .filter((room) => (room.displayTitle || '').toLowerCase().includes(roomFilter.toLowerCase()))
            .map((room) => (
              <li key={room.id}>
                <button
                  type="button"
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    selectedRoom?.id === room.id ? 'lms-chat-room-active' : 'bg-[var(--neutral-50)] text-[var(--neutral-700)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{room.displayTitle || room.title || 'Chat'}</span>
                    {room.unread_count > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs rounded-full bg-red-500 text-white">
                        {room.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-80">
                    {room.is_muted && <span>Muted</span>}
                    {room.email_muted && <span>Email off</span>}
                  </div>
                </button>
              </li>
            ))
        )}
      </ul>
    </LmsCard>
  );
}
