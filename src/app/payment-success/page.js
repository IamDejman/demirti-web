'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');

  return (
    <main>
      <Navbar />
      <section style={{ 
        padding: '10rem 0 6rem', 
        backgroundColor: '#ffffff',
        marginTop: '140px',
        textAlign: 'center'
      }}>
        <div className="container">
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ 
              fontSize: '4rem', 
              color: '#00c896', 
              marginBottom: '1.5rem' 
            }}>
              ✓
            </div>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              marginBottom: '1rem',
              color: '#1a1a1a'
            }}>
              Payment Successful!
            </h1>
            <p style={{ 
              fontSize: '1.25rem', 
              color: '#666666', 
              marginBottom: '2rem',
              lineHeight: '1.7'
            }}>
              Thank you for your payment. Your application has been received and we&apos;ll be in touch with you shortly.
            </p>
            {reference && (
              <p style={{ 
                fontSize: '1rem', 
                color: '#999999', 
                marginBottom: '2rem'
              }}>
                Reference: <strong>{reference}</strong>
              </p>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/" className="cta-button" style={{
                display: 'inline-block',
                backgroundColor: '#0066cc',
                color: 'white',
                padding: '1rem 2.5rem',
                borderRadius: '50px',
                fontWeight: '600',
                fontSize: '1.05rem',
                transition: 'all 0.3s ease'
              }}>
                Back to Home
              </Link>
              <Link href="/#contact" className="cta-button" style={{
                display: 'inline-block',
                backgroundColor: '#00c896',
                color: 'white',
                padding: '1rem 2.5rem',
                borderRadius: '50px',
                fontWeight: '600',
                fontSize: '1.05rem',
                transition: 'all 0.3s ease'
              }}>
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <main>
        <Navbar />
        <section style={{ 
          padding: '10rem 0 6rem', 
          backgroundColor: '#ffffff',
          marginTop: '140px',
          textAlign: 'center'
        }}>
          <div className="container">
            <p>Loading...</p>
          </div>
        </section>
      </main>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

