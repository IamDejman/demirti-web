'use client';

import { useEffect, useState } from 'react';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';

import { getLmsAuthHeaders } from '@/lib/authClient';
import { formatDateLagos, formatTimeLagos } from '@/lib/dateUtils';

function formatTimeOnly(d) {
  const s = formatTimeLagos(d);
  return s ? (s.split(', ')[1] || s) : '';
}

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

  const isMessageError = message && (message.includes('Failed') || message.includes('fail'));

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader title="Office Hours" subtitle="Book time with facilitators for extra support." icon={LmsIcons.clock} />
      {message && (
        <div className={`lms-alert ${isMessageError ? 'lms-alert-error' : 'lms-alert-success'}`} role="alert" aria-live="polite">
          {message}
        </div>
      )}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2" style={{ gap: 'var(--lms-space-4)' }}>
          <div className="lms-slot-card lms-skeleton" style={{ minHeight: 180 }} />
          <div className="lms-slot-card lms-skeleton" style={{ minHeight: 180 }} />
        </div>
      ) : (
        <LmsCard title="Available slots" subtitle={slots.length === 0 ? undefined : `${slots.length} slot${slots.length !== 1 ? 's' : ''} available`} icon={LmsIcons.clock}>
          {slots.length === 0 ? (
            <LmsEmptyState icon={LmsIcons.calendar} title="No office hour slots available" description="Check back later or contact your facilitator." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2" style={{ gap: 'var(--lms-space-4)' }}>
              {slots.map((slot) => (
                <div key={slot.id} className="lms-slot-card">
                  <div className="flex items-start gap-4">
                    <div className="lms-card-icon-box w-12 h-12 flex-shrink-0">
                      {LmsIcons.clock}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--neutral-900)]">{slot.title || 'Office hour slot'}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="lms-badge lms-badge-info">
                          {formatDateLagos(slot.start_time)}
                        </span>
                        <span className="text-xs text-[var(--neutral-500)]">
                          {formatTimeOnly(slot.start_time)} – {formatTimeOnly(slot.end_time)}
                        </span>
                      </div>
                      <p className="text-xs mt-2 text-[var(--neutral-500)]">
                        Facilitator: {slot.first_name || ''} {slot.last_name || ''}
                      </p>
                      {slot.description && <p className="text-sm mt-2 leading-relaxed text-[var(--neutral-600)]">{slot.description}</p>}
                    </div>
                  </div>
                  <div className="lms-slot-card-divider flex items-center justify-between">
                    {slot.meeting_link ? (
                      <a href={slot.meeting_link} className="lms-link text-sm font-medium">Join link</a>
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
