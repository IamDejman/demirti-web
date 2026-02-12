'use client';

import { useEffect, useState } from 'react';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';

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
    const res = await fetch('/api/office-hours/slots', { headers: getLmsAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.slots) setSlots(data.slots);
  };

  const loadCohorts = async () => {
    const res = await fetch('/api/cohorts', { headers: getLmsAuthHeaders() });
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
      headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
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
    await fetch(`/api/office-hours/slots/${slotId}/cancel`, { method: 'POST', headers: getLmsAuthHeaders() });
    await loadSlots();
  };

  const loadBookings = async (slotId) => {
    const res = await fetch(`/api/office-hours/slots/${slotId}/bookings`, { headers: getLmsAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.bookings) {
      setBookingsBySlot((prev) => ({ ...prev, [slotId]: data.bookings }));
    }
  };

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader title="Office Hours" subtitle="Create slots and manage bookings." icon={LmsIcons.clock}>
        {message && <p className="text-sm mt-2 opacity-80">{message}</p>}
      </LmsPageHeader>

      <LmsCard title="Create slot" icon={LmsIcons.clock}>
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div>
            <label className="lms-form-label">Title</label>
            <input
              type="text"
              placeholder="Office hour title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="lms-form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="lms-form-label">Description</label>
            <textarea
              rows={3}
              placeholder="What will be covered..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="lms-form-textarea w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="lms-form-label">Start time</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="lms-form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="lms-form-label">End time</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="lms-form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="lms-form-label">Meeting link</label>
              <input
                type="text"
                placeholder="https://..."
                value={form.meetingLink}
                onChange={(e) => setForm((f) => ({ ...f, meetingLink: e.target.value }))}
                className="lms-form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="lms-form-label">Capacity</label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value, 10) || 1 }))}
                className="lms-form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="lms-form-label">Cohort</label>
            <select
              value={form.cohortId}
              onChange={(e) => setForm((f) => ({ ...f, cohortId: e.target.value }))}
              className="lms-form-select w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Open to all cohorts</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
            Create slot
          </button>
        </form>
      </LmsCard>

      <LmsCard title="Your slots">
        {slots.length === 0 ? (
          <LmsEmptyState icon={LmsIcons.calendar} title="No slots yet" description="Create a slot above to allow students to book office hours." />
        ) : (
          <ul className="space-y-3">
            {slots.map((slot) => (
              <li key={slot.id} className="border-b pb-3 last:border-0" style={{ borderColor: 'var(--neutral-100)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--neutral-900)' }}>{slot.title || 'Office hour slot'}</p>
                    <p className="text-xs" style={{ color: 'var(--neutral-500)' }}>
                      {new Date(slot.start_time).toLocaleString()} - {new Date(slot.end_time).toLocaleTimeString()}
                    </p>
                    {slot.cohort_name && <p className="text-xs" style={{ color: 'var(--neutral-500)' }}>Cohort: {slot.cohort_name}</p>}
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
                  <ul className="mt-2 text-xs space-y-1" style={{ color: 'var(--neutral-500)' }}>
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
