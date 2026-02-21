'use client';

import { useState, useEffect } from 'react';
import { LmsCard, LmsEmptyState, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';
import { formatDateLagos } from '@/lib/dateUtils';

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
      <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
        <div className="h-24 lms-skeleton rounded-xl" />
        <div className="grid gap-6 sm:grid-cols-2" style={{ gap: 'var(--lms-space-6)' }}>
          <div className="lms-skeleton rounded-xl overflow-hidden" style={{ height: 180 }}>
            <div className="h-24 lms-skeleton" />
            <div className="h-20 lms-skeleton rounded-none" />
          </div>
          <div className="lms-skeleton rounded-xl overflow-hidden" style={{ height: 180 }}>
            <div className="h-24 lms-skeleton" />
            <div className="h-20 lms-skeleton rounded-none" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader
        title="Certificates"
        subtitle="Your completed track certificates."
        icon={LmsIcons.trophy}
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
        <div className="grid gap-6 sm:grid-cols-2" style={{ gap: 'var(--lms-space-6)' }}>
          {certificates.map((c) => (
            <div key={c.id} className="lms-certificate-card">
              <div className="lms-certificate-card-header">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm">
                    <span className="text-white">{LmsIcons.trophy}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{c.track_name || 'CVERSE Academy'}</h3>
                    <p className="text-sm mt-0.5 lms-certificate-card-header-sub">Certificate of Completion</p>
                  </div>
                </div>
              </div>
              <div className="lms-certificate-card-body flex items-center justify-between">
                <div>
                  {c.issued_at && (
                    <p className="text-xs text-[var(--neutral-500)]">
                      Issued {formatDateLagos(c.issued_at)}
                    </p>
                  )}
                </div>
                <a href={`/api/certificates/${c.id}/pdf`} className="lms-btn lms-btn-sm lms-btn-primary">
                  Download PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
