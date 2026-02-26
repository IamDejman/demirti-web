'use client';

import { useEffect, useState } from 'react';
import { LmsEmptyState } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { useToast } from '@/app/components/ToastProvider';
import { getLmsAuthHeaders } from '@/lib/authClient';
import { formatDateLagos, formatTimeLagos } from '@/lib/dateUtils';

function formatTimeOnly(d) {
  const s = formatTimeLagos(d);
  return s ? (s.split(', ')[1] || s) : '';
}

export default function OfficeHoursTab() {
  const { showToast } = useToast();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/office-hours/slots', { headers: getLmsAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.slots) setSlots(data.slots);
    } catch { /* silent */ }
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
      showToast({ type: 'error', message: data.error || 'Failed to book slot.' });
    }
    await loadSlots();
  };

  const handleCancel = async (slotId) => {
    const res = await fetch(`/api/office-hours/slots/${slotId}/cancel`, {
      method: 'POST',
      headers: getLmsAuthHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast({ type: 'error', message: data.error || 'Failed to cancel slot.' });
    }
    await loadSlots();
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" style={{ gap: 'var(--lms-space-4)' }}>
        <div className="lms-slot-card lms-skeleton" style={{ minHeight: 180 }} />
        <div className="lms-slot-card lms-skeleton" style={{ minHeight: 180 }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-4)' }}>
      {message && (
        <div className="lms-alert lms-alert-success" role="alert" aria-live="polite">
          {message}
        </div>
      )}

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
                  <h3 className="font-semibold" style={{ color: 'var(--neutral-900)' }}>{slot.title || 'Office hour slot'}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="lms-badge lms-badge-info">
                      {formatDateLagos(slot.start_time)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--neutral-500)' }}>
                      {formatTimeOnly(slot.start_time)} – {formatTimeOnly(slot.end_time)}
                    </span>
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--neutral-500)' }}>
                    Facilitator: {slot.first_name || ''} {slot.last_name || ''}
                  </p>
                  {slot.description && <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--neutral-600)' }}>{slot.description}</p>}
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
    </div>
  );
}
