'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function ConfirmSpotPage() {
  const [email, setEmail] = useState('');
  const [linkedinPostUrl, setLinkedinPostUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/confirm-sponsored-spot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          linkedinPostUrl: linkedinPostUrl.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setMessage(data.message);
      } else {
        setSuccess(false);
        setMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setSuccess(false);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="with-fixed-header">
      <Navbar />
      <section style={{
        padding: '8rem 1.5rem 4rem',
        maxWidth: '560px',
        margin: '0 auto',
        minHeight: '60vh'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', textAlign: 'center' }}>
          Confirm your spot
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem', textAlign: 'center' }}>
          You were conditionally accepted to the CVerse Data Science Academy sponsored cohort. Submit the link to your LinkedIn post here to confirm your spot (within 48 hours of acceptance).
        </p>

        {success ? (
          <div style={{
            padding: '2rem',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '12px',
            color: '#155724',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontWeight: '600' }}>{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="confirm-email" style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem' }}>
                Email address *
              </label>
              <input
                id="confirm-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Same email you used to apply"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="confirm-linkedin" style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem' }}>
                Link to your LinkedIn post *
              </label>
              <input
                id="confirm-linkedin"
                type="url"
                required
                value={linkedinPostUrl}
                onChange={(e) => setLinkedinPostUrl(e.target.value)}
                placeholder="https://www.linkedin.com/..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
            {message && !success && (
              <p style={{ color: '#dc3545', marginBottom: '1rem' }}>{message}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                backgroundColor: submitting ? '#ccc' : '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Submitting...' : 'Confirm my spot'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
          <Link href="/datascience" style={{ color: '#0066cc' }}>Back to Data Science track</Link>
        </p>
      </section>
    </main>
  );
}
