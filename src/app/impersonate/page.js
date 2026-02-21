'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ImpersonateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const redirect = searchParams.get('redirect') || '/dashboard';
    const email = searchParams.get('email');
    localStorage.setItem('lms_authenticated', 'true');
    localStorage.setItem('impersonating', 'true');
    if (email) localStorage.setItem('impersonate_email', email);
    router.push(redirect);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-600">Opening impersonated session...</p>
    </div>
  );
}

export default function ImpersonatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <ImpersonateContent />
    </Suspense>
  );
}
