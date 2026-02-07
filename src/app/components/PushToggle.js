'use client';

import { useEffect, useState } from 'react';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof window !== 'undefined' && window.atob ? window.atob(base64) : '';
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasSupport = 'serviceWorker' in navigator && 'PushManager' in window;
    setSupported(hasSupport);
    if (!hasSupport) return;
    navigator.serviceWorker.ready.then((reg) => reg.pushManager.getSubscription()).then((sub) => {
      setEnabled(Boolean(sub));
    });
  }, []);

  const handleToggle = async () => {
    if (!supported) return;
    setLoading(true);
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ endpoint: existing.endpoint }),
      });
      await existing.unsubscribe();
      setEnabled(false);
      setLoading(false);
      return;
    }
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setLoading(false);
      return;
    }
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(subscription),
    });
    setEnabled(true);
    setLoading(false);
  };

  if (!supported) {
    return <p className="text-sm text-gray-500">Push notifications not supported in this browser.</p>;
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
    >
      {loading ? 'Updating...' : enabled ? 'Disable push notifications' : 'Enable push notifications'}
    </button>
  );
}
