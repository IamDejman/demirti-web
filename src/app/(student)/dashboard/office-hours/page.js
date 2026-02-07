'use client';

import { useEffect, useState } from 'react';
import { LmsCard, LmsEmptyState } from '@/app/components/lms';

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Office Hours</h1>
        <p className="text-gray-600 mt-1">Book time with facilitators for extra support.</p>
        {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}
      </div>
      {loading ? (
        <div className="h-64 lms-skeleton rounded-xl" />
      ) : (
        <LmsCard title="Available slots" subtitle={slots.length === 0 ? undefined : `${slots.length} slot${slots.length !== 1 ? 's' : ''} available`}>
          {slots.length === 0 ? (
            <LmsEmptyState title="No office hour slots available" description="Check back later or contact your facilitator." />
          ) : (
            <div className="grid gap-4">
              {slots.map((slot) => (
                <div key={slot.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{slot.title || 'Office hour slot'}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(slot.start_time).toLocaleString()} – {new Date(slot.end_time).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Facilitator: {slot.first_name || ''} {slot.last_name || ''}
                      </p>
                      {slot.description && <p className="text-sm text-gray-600 mt-2">{slot.description}</p>}
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
                        className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
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
