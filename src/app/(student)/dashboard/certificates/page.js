'use client';

import { useState, useEffect } from 'react';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/certificates', { headers: getLmsAuthHeaders() });
        const data = await res.json();
        if (res.ok && data.certificates) setCertificates(data.certificates);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-10 w-64 lms-skeleton rounded-lg" />
        <div className="h-64 lms-skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <LmsPageHeader
        title="Certificates"
        subtitle="Your completed track certificates."
        icon={LmsIcons.trophy}
        breadcrumb={{ href: '/dashboard', label: 'Dashboard' }}
      />

      {certificates.length === 0 ? (
        <LmsCard hoverable={false}>
          <LmsEmptyState
            icon={LmsIcons.trophy}
            title="No certificates yet"
            description="Complete a track to receive your certificate."
          />
        </LmsCard>
      ) : (
        <LmsCard title="Certificates" icon={LmsIcons.trophy}>
          <ul className="space-y-2">
            {certificates.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--neutral-100)' }}>
                <span className="text-sm" style={{ color: 'var(--neutral-900)' }}>{c.track_name || 'CVERSE Academy'}</span>
                <a href={`/api/certificates/${c.id}/pdf`} className="text-xs text-primary hover:underline">
                  Download PDF
                </a>
              </li>
            ))}
          </ul>
        </LmsCard>
      )}
    </div>
  );
}
