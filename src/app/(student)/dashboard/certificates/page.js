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
        <div className="grid gap-6 sm:grid-cols-2">
          {certificates.map((c) => (
            <div key={c.id} className="lms-card rounded-xl overflow-hidden" style={{ border: '1px solid var(--neutral-100)' }}>
              {/* Certificate header with gradient */}
              <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, #0066cc 50%, #00a67e 100%)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                    <span style={{ color: 'white' }}>{LmsIcons.trophy}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{c.track_name || 'CVERSE Academy'}</h3>
                    <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>Certificate of Completion</p>
                  </div>
                </div>
              </div>
              {/* Certificate body */}
              <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: 'white' }}>
                <div>
                  {c.issued_at && (
                    <p className="text-xs" style={{ color: 'var(--neutral-500)' }}>
                      Issued {new Date(c.issued_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
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
