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
        <LmsCard title="Available slots" subtitle={slots.length === 0 ? undefined : `${slots.length} slot${slots.length !== 1 ? 's' : ''} available`} icon={LmsIcons.clock}>
          {slots.length === 0 ? (
            <LmsEmptyState icon={LmsIcons.calendar} title="No office hour slots available" description="Check back later or contact your facilitator." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {slots.map((slot) => (
                <div key={slot.id} className="rounded-xl p-5 transition-all hover:shadow-md" style={{ border: '1px solid var(--neutral-100)', background: 'white' }}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.1), rgba(0, 166, 126, 0.08))', color: 'var(--primary-color)' }}>
                      {LmsIcons.clock}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold" style={{ color: 'var(--neutral-900)' }}>{slot.title || 'Office hour slot'}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="lms-badge lms-badge-info">
                          {new Date(slot.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--neutral-500)' }}>
                          {new Date(slot.start_time).toLocaleTimeString(undefined, { timeStyle: 'short' })} – {new Date(slot.end_time).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs mt-2" style={{ color: 'var(--neutral-500)' }}>
                        Facilitator: {slot.first_name || ''} {slot.last_name || ''}
                      </p>
                      {slot.description && <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--neutral-600)' }}>{slot.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--neutral-100)' }}>
                    {slot.meeting_link ? (
                      <a href={slot.meeting_link} className="text-sm font-medium text-primary hover:underline">Join link</a>
                    ) : <span />}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleBook(slot.id)} className="lms-btn lms-btn-sm lms-btn-primary">Book</button>
                      <button type="button" onClick={() => handleCancel(slot.id)} className="lms-btn lms-btn-sm lms-btn-secondary">Cancel</button>
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
