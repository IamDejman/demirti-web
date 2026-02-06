'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ImpersonatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');
    const redirect = searchParams.get('redirect') || '/dashboard';
    if (!token) {
      router.push('/admin');
      return;
    }
    localStorage.setItem('lms_token', token);
    router.push(redirect);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-600">Opening impersonated session...</p>
    </div>
  );
}
