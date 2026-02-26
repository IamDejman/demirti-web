'use client';

import { useState } from 'react';
import { LmsCard } from '@/app/components/lms';

export default function ChatRoomList({
  rooms,
  selectedRoom,
  setSelectedRoom,
  roomFilter,
  setRoomFilter,
  userSearch,
  setUserSearch,
  userResults,
  handleCreateDmWithUser,
  students,
  mode = 'all',
}) {
  const [showStudents, setShowStudents] = useState(false);
  const [studentFilter, setStudentFilter] = useState('');

  const filteredRooms = rooms.filter((room) =>
    (room.displayTitle || '').toLowerCase().includes(roomFilter.toLowerCase())
  );

  const filteredStudents = (students || []).filter((s) =>
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(studentFilter.toLowerCase())
  );

  const showDmSearch = mode !== 'community';
  const listTitle = mode === 'community' ? 'Discussions' : mode === 'chat' ? 'Messages' : 'Conversations';
  const emptyMessage = mode === 'community'
    ? 'No community discussions yet. They will appear when you join a cohort.'
    : mode === 'chat'
      ? 'No direct messages yet. Search for a user above to start a conversation.'
      : 'No conversations yet.';
  const searchPlaceholder = mode === 'community' ? 'Search discussions...' : 'Search conversations...';

  return (
    <div className="md:col-span-1 flex flex-col" style={{ gap: 'var(--lms-space-4)' }}>
      {/* Search / new conversation */}
      <LmsCard hoverable={false}>
        <div className="flex flex-col" style={{ gap: 'var(--lms-space-3)' }}>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="lms-input"
          />

          {/* User search for starting new DMs — hidden in community mode */}
          {showDmSearch && (
            <>
              <input
                type="text"
                placeholder="Find user by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="lms-input"
              />
              {userResults.length > 0 && (
                <div style={{ borderRadius: '8px', border: '1px solid var(--neutral-200)', overflow: 'hidden' }}>
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleCreateDmWithUser(u.id)}
                      className="lms-chat-user-result"
                    >
                      <div className="lms-chat-avatar">
                        {(u.first_name?.[0] || u.email[0]).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p className="lms-chat-user-name">{u.first_name || ''} {u.last_name || ''}</p>
                        <p className="lms-chat-user-email">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </LmsCard>

      {/* Student directory (facilitator only) */}
      {students && students.length > 0 && (
        <LmsCard hoverable={false}>
          <button
            type="button"
            onClick={() => setShowStudents((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, color: 'var(--neutral-800)', fontWeight: 600, fontSize: '0.875rem',
            }}
          >
            <span>Students ({students.length})</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: showStudents ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showStudents && (
            <div style={{ marginTop: 'var(--lms-space-3)' }}>
              {students.length > 5 && (
                <input
                  type="text"
                  placeholder="Filter students..."
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className="lms-input"
                  style={{ marginBottom: 'var(--lms-space-3)', fontSize: '0.8125rem' }}
                />
              )}
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {filteredStudents.length === 0 ? (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-500)', padding: '0.5rem 0' }}>
                    {studentFilter ? 'No students match filter.' : 'No students.'}
                  </p>
                ) : (
                  filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleCreateDmWithUser(s.student_id || s.id)}
                      className="lms-chat-user-result"
                    >
                      <div className="lms-chat-avatar">
                        {(s.first_name?.[0] || '?').toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p className="lms-chat-user-name">{s.first_name} {s.last_name}</p>
                        <p className="lms-chat-user-email">{s.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </LmsCard>
      )}

      {/* Room list */}
      <LmsCard title={listTitle} hoverable={false}>
        {filteredRooms.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
            {roomFilter ? 'No results match your search.' : emptyMessage}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredRooms.map((room) => {
              const isActive = selectedRoom?.id === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setSelectedRoom(room)}
                  className={`lms-chat-room ${isActive ? 'lms-chat-room-active' : ''}`}
                >
                  <div className="lms-chat-avatar" style={isActive ? { background: 'var(--primary-color)', color: '#fff' } : {}}>
                    {(room.displayTitle || room.title || 'C')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span className="lms-chat-room-title">{room.displayTitle || room.title || 'Chat'}</span>
                      {room.unread_count > 0 && (
                        <span className="lms-chat-unread">{room.unread_count}</span>
                      )}
                    </div>
                    {(room.is_muted || room.email_muted) && (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--neutral-400)' }}>
                        {room.is_muted && 'Muted'}{room.is_muted && room.email_muted && ' · '}{room.email_muted && 'Email off'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </LmsCard>
    </div>
  );
}
