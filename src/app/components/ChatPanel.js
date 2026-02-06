'use client';

import { useEffect, useState } from 'react';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ChatPanel() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [dmEmail, setDmEmail] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRooms = async () => {
    const res = await fetch('/api/chat/rooms', { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.rooms) {
      setRooms(data.rooms);
      if (!selectedRoom && data.rooms.length > 0) {
        setSelectedRoom(data.rooms[0]);
      }
    }
  };

  const loadMessages = async (roomId) => {
    if (!roomId) return;
    const res = await fetch(`/api/chat/rooms/${roomId}/messages?limit=50`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.messages) setMessages(data.messages);
  };

  useEffect(() => {
    loadRooms().finally(() => setLoading(false));
    const interval = setInterval(() => loadRooms(), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!userSearch.trim() || userSearch.trim().length < 2) {
        setUserResults([]);
        return;
      }
      const res = await fetch(`/api/chat/users?q=${encodeURIComponent(userSearch.trim())}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.users) setUserResults(data.users);
    }, 300);
    return () => clearTimeout(handler);
  }, [userSearch]);

  useEffect(() => {
    if (!selectedRoom) return;
    loadMessages(selectedRoom.id);
    const interval = setInterval(() => loadMessages(selectedRoom.id), 5000);
    return () => clearInterval(interval);
  }, [selectedRoom?.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedRoom) return;
    await fetch(`/api/chat/rooms/${selectedRoom.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ message: messageText.trim() }),
    });
    setMessageText('');
    await loadMessages(selectedRoom.id);
  };

  const handleLoadOlder = async () => {
    if (!selectedRoom || messages.length === 0) return;
    setLoadingOlder(true);
    const oldest = messages[0]?.created_at;
    const res = await fetch(`/api/chat/rooms/${selectedRoom.id}/messages?limit=50&before=${encodeURIComponent(oldest)}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.messages && data.messages.length > 0) {
      setMessages((prev) => [...data.messages, ...prev]);
    }
    setLoadingOlder(false);
  };

  const handleCreateDm = async (e) => {
    e.preventDefault();
    if (!dmEmail.trim()) return;
    const res = await fetch('/api/chat/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ type: 'dm', email: dmEmail.trim() }),
    });
    const data = await res.json();
    if (res.ok && data.room) {
      await loadRooms();
      setDmEmail('');
    }
  };

  const handleCreateDmWithUser = async (userId) => {
    const res = await fetch('/api/chat/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ type: 'dm', otherUserId: userId }),
    });
    const data = await res.json();
    if (res.ok && data.room) {
      await loadRooms();
      setSelectedRoom(data.room);
      setUserSearch('');
      setUserResults([]);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Loading chat...</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:col-span-1">
        <h2 className="text-lg font-semibold text-gray-900">Rooms</h2>
        <form onSubmit={handleCreateDm} className="mt-4 space-y-2">
          <input
            type="email"
            placeholder="Start DM with email"
            value={dmEmail}
            onChange={(e) => setDmEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button type="submit" className="w-full px-3 py-2 bg-primary text-white text-sm rounded-lg">
            Start DM
          </button>
        </form>
        <div className="mt-3">
          <input
            type="text"
            placeholder="Search rooms"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="mt-3">
          <input
            type="text"
            placeholder="Find user by name/email"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          {userResults.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {userResults.map((u) => (
                <li key={u.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1">
                  <span>{u.first_name || ''} {u.last_name || ''} · {u.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCreateDmWithUser(u.id)}
                    className="text-primary text-xs font-medium"
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
            <li className="text-sm text-gray-500">No rooms yet.</li>
          ) : (
            rooms
              .filter((room) => (room.displayTitle || '').toLowerCase().includes(roomFilter.toLowerCase()))
              .map((room) => (
              <li key={room.id}>
                <button
                  type="button"
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    selectedRoom?.id === room.id ? 'bg-primary text-white' : 'bg-gray-50 text-gray-700'
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
                  <div className="flex items-center gap-2 text-xs text-gray-200">
                    {room.is_muted && <span>Muted</span>}
                    {room.email_muted && <span>Email off</span>}
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:col-span-2 flex flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{selectedRoom?.displayTitle || 'Messages'}</h2>
          {selectedRoom && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <button
                type="button"
                onClick={async () => {
                  const nextMuted = !selectedRoom.is_muted;
                  await fetch(`/api/chat/rooms/${selectedRoom.id}/mute`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify({ isMuted: nextMuted, emailMuted: selectedRoom.email_muted }),
                  });
                  await loadRooms();
                  setSelectedRoom((prev) => prev ? { ...prev, is_muted: nextMuted } : prev);
                }}
                className="hover:text-primary"
              >
                {selectedRoom.is_muted ? 'Unmute' : 'Mute'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const nextEmailMuted = !selectedRoom.email_muted;
                  await fetch(`/api/chat/rooms/${selectedRoom.id}/mute`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify({ isMuted: selectedRoom.is_muted, emailMuted: nextEmailMuted }),
                  });
                  await loadRooms();
                  setSelectedRoom((prev) => prev ? { ...prev, email_muted: nextEmailMuted } : prev);
                }}
                className="hover:text-primary"
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
            className="mt-3 text-xs text-primary hover:underline self-start"
          >
            {loadingOlder ? 'Loading...' : 'Load older'}
          </button>
        )}
        <div className="mt-4 flex-1 overflow-auto border border-gray-100 rounded-lg p-3 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-500">No messages yet.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="border-b border-gray-100 pb-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {m.first_name || m.email}
                  </p>
                  <button
                    type="button"
                    onClick={() => fetch(`/api/chat/messages/${m.id}/report`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                      body: JSON.stringify({ reason: 'report' }),
                    })}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Report
                  </button>
                </div>
                <p className="text-sm text-gray-700 mt-1">{m.body}</p>
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
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button type="submit" className="px-4 py-2 bg-primary text-white text-sm rounded-lg">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
