'use client';

import { useEffect, useState } from 'react';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function StudentOfficeHoursPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadSlots = async () => {
    setLoading(true);
    const res = await fetch('/api/office-hours/slots', { headers: getAuthHeaders() });
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
    });
    await loadSlots();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Office Hours</h1>
        <p className="text-gray-600 mt-1">Book time with facilitators for extra support.</p>
        {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}
      </div>
      {loading ? (
        <p className="text-gray-500">Loading slots...</p>
      ) : slots.length === 0 ? (
        <p className="text-gray-500">No office hour slots available.</p>
      ) : (
        <div className="grid gap-4">
          {slots.map((slot) => (
            <div key={slot.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{slot.title || 'Office hour slot'}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(slot.start_time).toLocaleString()} - {new Date(slot.end_time).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Facilitator: {slot.first_name || ''} {slot.last_name || ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleBook(slot.id)}
                    className="px-3 py-2 bg-primary text-white text-sm rounded-lg"
                  >
                    Book
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancel(slot.id)}
                    className="px-3 py-2 border border-gray-300 text-sm rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              {slot.description && <p className="text-sm text-gray-600 mt-2">{slot.description}</p>}
              {slot.meeting_link && (
                <a href={slot.meeting_link} className="text-sm text-primary mt-2 inline-block">
                  Join link
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
