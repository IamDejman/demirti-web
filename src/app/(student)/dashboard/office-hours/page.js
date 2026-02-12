'use client';

import { useEffect, useState } from 'react';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';

export default function StudentOfficeHoursPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadSlots = async () => {
    setLoading(true);
    const res = await fetch('/api/office-hours/slots', { headers: getLmsAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.slots) setSlots(data.slots);
    setLoading(false);
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleBook = async (slotId) => {
    setMessage('');
    const res = await fetch(`/api/office-hours/slots/${slotId}/book`, {
      method: 'POST',
      headers: getLmsAuthHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('Slot booked.');
    } else {
      setMessage(data.error || 'Failed to book slot.');
    }
    await loadSlots();
  };

  const handleCancel = async (slotId) => {
    await fetch(`/api/office-hours/slots/${slotId}/cancel`, {
      method: 'POST',
      headers: getLmsAuthHeaders(),
    });
    await loadSlots();
  };

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader title="Office Hours" subtitle="Book time with facilitators for extra support." icon={LmsIcons.clock}>
        {message && <p className="text-sm mt-2 opacity-80">{message}</p>}
      </LmsPageHeader>
      {loading ? (
        <div className="h-64 lms-skeleton rounded-xl" />
      ) : (
        <LmsCard title="Available slots" subtitle={slots.length === 0 ? undefined : `${slots.length} slot${slots.length !== 1 ? 's' : ''} available`}>
          {slots.length === 0 ? (
            <LmsEmptyState icon={LmsIcons.calendar} title="No office hour slots available" description="Check back later or contact your facilitator." />
          ) : (
            <div className="grid" style={{ gap: 'var(--lms-space-4)' }}>
              {slots.map((slot) => (
                <div key={slot.id} className="rounded-lg p-4 transition-colors border" style={{ borderColor: 'var(--neutral-100)' }}>
                  <div className="flex items-start justify-between" style={{ gap: 'var(--lms-space-4)' }}>
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--neutral-900)' }}>{slot.title || 'Office hour slot'}</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--neutral-500)' }}>
                        {new Date(slot.start_time).toLocaleString()} – {new Date(slot.end_time).toLocaleTimeString()}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--neutral-500)' }}>
                        Facilitator: {slot.first_name || ''} {slot.last_name || ''}
                      </p>
                      {slot.description && <p className="text-sm mt-2" style={{ color: 'var(--neutral-600)' }}>{slot.description}</p>}
                      {slot.meeting_link && (
                        <a href={slot.meeting_link} className="text-sm text-primary mt-2 inline-block hover:underline">
                          Join link
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleBook(slot.id)}
                        className="px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        Book
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(slot.id)}
                        className="px-3 py-2 border text-sm font-medium rounded-lg transition-colors hover:bg-gray-50"
                        style={{ borderColor: 'var(--neutral-300)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </LmsCard>
      )}
    </div>
  );
}
