'use client';

import { useEffect, useState } from 'react';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';
import { useToast } from '@/app/components/ToastProvider';

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
  const { showToast } = useToast();
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
      showToast({ type: 'error', message: data.error || 'Failed to create slot.' });
    }
  };

  const handleCancel = async (slotId) => {
    const res = await fetch(`/api/office-hours/slots/${slotId}/cancel`, { method: 'POST', headers: getLmsAuthHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast({ type: 'error', message: data.error || 'Failed to cancel slot.' });
    }
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
      <LmsPageHeader title="Office Hours" subtitle="Create slots and manage bookings." icon={LmsIcons.clock} />
      {message && (
        <div className="lms-alert lms-alert-success" role="alert" aria-live="polite">
          {message}
        </div>
      )}

      <LmsCard title="Create slot" icon={LmsIcons.clock}>
        <form onSubmit={handleCreate} className="flex flex-col mt-4" style={{ gap: 'var(--lms-space-4)' }}>
          <div>
            <label className="lms-form-label block mb-1.5">Title</label>
            <input
              type="text"
              placeholder="Office hour title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="lms-input w-full"
            />
          </div>
          <div>
            <label className="lms-form-label block mb-1.5">Description</label>
            <textarea
              rows={3}
              placeholder="What will be covered..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="lms-input w-full"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="lms-form-label block mb-1.5">Start time</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="lms-input w-full"
              />
            </div>
            <div>
              <label className="lms-form-label block mb-1.5">End time</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="lms-input w-full"
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="lms-form-label block mb-1.5">Meeting link</label>
              <input
                type="text"
                placeholder="https://..."
                value={form.meetingLink}
                onChange={(e) => setForm((f) => ({ ...f, meetingLink: e.target.value }))}
                className="lms-input w-full"
              />
            </div>
            <div>
              <label className="lms-form-label block mb-1.5">Capacity</label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value, 10) || 1 }))}
                className="lms-input w-full"
              />
            </div>
          </div>
          <div>
            <label className="lms-form-label block mb-1.5">Cohort</label>
            <select
              value={form.cohortId}
              onChange={(e) => setForm((f) => ({ ...f, cohortId: e.target.value }))}
              className="lms-input w-full"
            >
              <option value="">Open to all cohorts</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="lms-btn lms-btn-primary">
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
              <li key={slot.id} className="border-b border-[var(--neutral-100)] pb-3 last:border-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--neutral-900)]">{slot.title || 'Office hour slot'}</p>
                    <p className="text-xs text-[var(--neutral-500)]">
                      {new Date(slot.start_time).toLocaleString()} - {new Date(slot.end_time).toLocaleTimeString()}
                    </p>
                    {slot.cohort_name && <p className="text-xs text-[var(--neutral-500)]">Cohort: {slot.cohort_name}</p>}
                  </div>
                  <div className="flex flex-wrap gap-3 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => loadBookings(slot.id)}
                      className="lms-link text-xs bg-transparent border-none cursor-pointer p-0"
                    >
                      View bookings
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(slot.id)}
                      className="text-xs text-red-600 hover:underline bg-transparent border-none cursor-pointer p-0"
                    >
                      Cancel slot
                    </button>
                  </div>
                </div>
                {bookingsBySlot[slot.id]?.length > 0 && (
                  <ul className="mt-2 text-xs space-y-1 text-[var(--neutral-500)]">
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
