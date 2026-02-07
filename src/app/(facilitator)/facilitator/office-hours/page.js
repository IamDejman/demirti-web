'use client';

import { useEffect, useState } from 'react';
import { LmsCard, LmsEmptyState } from '@/app/components/lms';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const emptyForm = {
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  meetingLink: '',
  capacity: 1,
  cohortId: '',
};

export default function FacilitatorOfficeHoursPage() {
  const [slots, setSlots] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [bookingsBySlot, setBookingsBySlot] = useState({});

  const loadSlots = async () => {
    const res = await fetch('/api/office-hours/slots', { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.slots) setSlots(data.slots);
  };

  const loadCohorts = async () => {
    const res = await fetch('/api/cohorts', { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.cohorts) setCohorts(data.cohorts);
  };

  useEffect(() => {
    loadSlots();
    loadCohorts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!form.startTime || !form.endTime) return;
    const res = await fetch('/api/office-hours/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('Slot created.');
      setForm(emptyForm);
      await loadSlots();
    } else {
      setMessage(data.error || 'Failed to create slot.');
    }
  };

  const handleCancel = async (slotId) => {
    await fetch(`/api/office-hours/slots/${slotId}/cancel`, { method: 'POST', headers: getAuthHeaders() });
    await loadSlots();
  };

  const loadBookings = async (slotId) => {
    const res = await fetch(`/api/office-hours/slots/${slotId}/bookings`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.bookings) {
      setBookingsBySlot((prev) => ({ ...prev, [slotId]: data.bookings }));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Office Hours</h1>
        <p className="text-gray-600 mt-1">Create slots and manage bookings.</p>
        {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}
      </div>

      <LmsCard title="Create slot">
        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <textarea
            rows={3}
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Meeting link"
              value={form.meetingLink}
              onChange={(e) => setForm((f) => ({ ...f, meetingLink: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value, 10) || 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select
            value={form.cohortId}
            onChange={(e) => setForm((f) => ({ ...f, cohortId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Open to all cohorts</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
            Create slot
          </button>
        </form>
      </LmsCard>

      <LmsCard title="Your slots">
        {slots.length === 0 ? (
          <LmsEmptyState title="No slots yet" description="Create a slot above to allow students to book office hours." />
        ) : (
          <ul className="space-y-3">
            {slots.map((slot) => (
              <li key={slot.id} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{slot.title || 'Office hour slot'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(slot.start_time).toLocaleString()} - {new Date(slot.end_time).toLocaleTimeString()}
                    </p>
                    {slot.cohort_name && <p className="text-xs text-gray-500">Cohort: {slot.cohort_name}</p>}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => loadBookings(slot.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      View bookings
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(slot.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Cancel slot
                    </button>
                  </div>
                </div>
                {bookingsBySlot[slot.id]?.length > 0 && (
                  <ul className="mt-2 text-xs text-gray-500 space-y-1">
                    {bookingsBySlot[slot.id].map((b) => (
                      <li key={b.id}>{b.first_name || ''} {b.last_name || ''} · {b.email}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </LmsCard>
    </div>
  );
}
