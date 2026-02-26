'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getLmsAuthHeaders } from '@/lib/authClient';
import { useVisibilityPolling } from '@/hooks/useVisibilityPolling';
import ChatRoomList from '@/app/components/chat/ChatRoomList';
import ChatMessageList from '@/app/components/chat/ChatMessageList';

/**
 * @param {'all'|'chat'|'community'} mode
 *   - 'all'       – show every room (default, used by facilitator)
 *   - 'chat'      – DM rooms only
 *   - 'community' – cohort / group rooms only
 */
export default function ChatPanel({ students, currentUserId, mode = 'all' }) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRooms = useCallback(async () => {
    const res = await fetch('/api/chat/rooms', { headers: getLmsAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.rooms) {
      setRooms(data.rooms);
    }
  }, []);

  /* Filter rooms by mode */
  const filteredRooms = useMemo(() => {
    if (mode === 'chat') return rooms.filter((r) => r.type === 'dm');
    if (mode === 'community') return rooms.filter((r) => r.type !== 'dm');
    return rooms;
  }, [rooms, mode]);

  /* Auto-select first room when filtered list changes */
  useEffect(() => {
    if (!selectedRoom && filteredRooms.length > 0) {
      setSelectedRoom(filteredRooms[0]);
    } else if (selectedRoom && filteredRooms.length > 0 && !filteredRooms.find((r) => r.id === selectedRoom.id)) {
      setSelectedRoom(filteredRooms[0]);
    }
  }, [filteredRooms, selectedRoom]);

  const loadMessages = useCallback(async (roomId) => {
    if (!roomId) return;
    const res = await fetch(`/api/chat/rooms/${roomId}/messages?limit=50`, { headers: getLmsAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.messages) setMessages(data.messages);
  }, []);

  useEffect(() => {
    loadRooms().finally(() => setLoading(false));
  }, []);

  useVisibilityPolling(loadRooms, 15000);

  useEffect(() => {
    if (mode === 'community') return; // no DM search in community mode
    const handler = setTimeout(async () => {
      if (!userSearch.trim() || userSearch.trim().length < 2) {
        setUserResults([]);
        return;
      }
      const res = await fetch(`/api/chat/users?q=${encodeURIComponent(userSearch.trim())}`, { headers: getLmsAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.users) setUserResults(data.users);
    }, 300);
    return () => clearTimeout(handler);
  }, [userSearch, mode]);

  useEffect(() => {
    if (!selectedRoom) return;
    loadMessages(selectedRoom.id);
  }, [selectedRoom?.id, loadMessages]);

  useVisibilityPolling(
    () => selectedRoom && loadMessages(selectedRoom.id),
    5000,
    !!selectedRoom,
  );

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedRoom) return;
    await fetch(`/api/chat/rooms/${selectedRoom.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
      body: JSON.stringify({ message: messageText.trim() }),
    });
    setMessageText('');
    await loadMessages(selectedRoom.id);
  };

  const handleLoadOlder = async () => {
    if (!selectedRoom || messages.length === 0) return;
    setLoadingOlder(true);
    const oldest = messages[0]?.created_at;
    const res = await fetch(`/api/chat/rooms/${selectedRoom.id}/messages?limit=50&before=${encodeURIComponent(oldest)}`, { headers: getLmsAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.messages && data.messages.length > 0) {
      setMessages((prev) => [...data.messages, ...prev]);
    }
    setLoadingOlder(false);
  };

  const handleCreateDmWithUser = async (userId) => {
    const res = await fetch('/api/chat/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
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
    return (
      <div className="grid gap-3 md:gap-6 md:grid-cols-3">
        <div className="h-96 lms-skeleton rounded-xl md:col-span-1" />
        <div className="h-96 lms-skeleton rounded-xl md:col-span-2" />
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:gap-6 md:grid-cols-3">
      <ChatRoomList
        rooms={filteredRooms}
        selectedRoom={selectedRoom}
        setSelectedRoom={setSelectedRoom}
        roomFilter={roomFilter}
        setRoomFilter={setRoomFilter}
        userSearch={userSearch}
        setUserSearch={setUserSearch}
        userResults={userResults}
        handleCreateDmWithUser={handleCreateDmWithUser}
        students={students}
        mode={mode}
      />
      <ChatMessageList
        messages={messages}
        selectedRoom={selectedRoom}
        messageText={messageText}
        setMessageText={setMessageText}
        handleSend={handleSend}
        handleLoadOlder={handleLoadOlder}
        loadingOlder={loadingOlder}
        loadRooms={loadRooms}
        setSelectedRoom={setSelectedRoom}
        currentUserId={currentUserId}
      />
    </div>
  );
}
