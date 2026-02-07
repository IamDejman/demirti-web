'use client';

import Navbar from '../../components/Navbar';
import SponsoredApplicationForm from '../../components/SponsoredApplicationForm';

export default function SponsoredCohortPage() {
  return (
    <main className="with-fixed-header">
      <Navbar />
      <section style={{
        padding: '8rem 1.5rem 4rem',
        minHeight: '80vh'
      }}>
        <div className="container">
          <div style={{
            maxWidth: '700px',
            margin: '0 auto',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h1 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              CVerse Data Science Academy — Sponsored Cohort Application
            </h1>
            <p style={{ fontSize: '1rem', color: '#666666', marginBottom: '0.5rem' }}>
              Monday 2nd – Friday 6th February 2026
            </p>
            <p style={{ fontSize: '0.95rem', color: '#666666', marginBottom: '1.5rem' }}>
              Limited sponsored spots. Submit your essay and we&apos;ll review. If selected, you&apos;ll have 48 hours to confirm with a LinkedIn post.
            </p>
          </div>
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '700px',
            margin: '0 auto',
            border: '1px solid #e1e4e8'
          }}>
            <SponsoredApplicationForm />
          </div>
        </div>
      </section>
    </main>
  );
}
