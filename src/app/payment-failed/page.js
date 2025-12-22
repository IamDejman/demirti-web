'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

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
              color: '#ff6b6b', 
              marginBottom: '1.5rem' 
            }}>
              ✕
            </div>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              marginBottom: '1rem',
              color: '#1a1a1a'
            }}>
              Payment Failed
            </h1>
            <p style={{ 
              fontSize: '1.25rem', 
              color: '#666666', 
              marginBottom: '2rem',
              lineHeight: '1.7'
            }}>
              We&apos;re sorry, but your payment could not be processed. Please try again or contact us if the problem persists.
            </p>
            {error && (
              <p style={{ 
                fontSize: '0.95rem', 
                color: '#999999', 
                marginBottom: '2rem',
                fontStyle: 'italic'
              }}>
                Error: {error}
              </p>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/data-science#apply-section" className="cta-button" style={{
                display: 'inline-block',
                backgroundColor: '#0066cc',
                color: 'white',
                padding: '1rem 2.5rem',
                borderRadius: '50px',
                fontWeight: '600',
                fontSize: '1.05rem',
                transition: 'all 0.3s ease'
              }}>
                Try Again - Data Science
              </Link>
              <Link href="/project-management#apply-section" className="cta-button" style={{
                display: 'inline-block',
                backgroundColor: '#00c896',
                color: 'white',
                padding: '1rem 2.5rem',
                borderRadius: '50px',
                fontWeight: '600',
                fontSize: '1.05rem',
                transition: 'all 0.3s ease'
              }}>
                Try Again - Project Management
              </Link>
            </div>
            <p style={{ marginTop: '2rem' }}>
              <Link href="/#contact" style={{ color: '#0066cc', textDecoration: 'underline' }}>
                Contact us for assistance
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function PaymentFailedPage() {
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
      <PaymentFailedContent />
    </Suspense>
  );
}

