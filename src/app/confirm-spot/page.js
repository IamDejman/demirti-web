'use client';

import { useState } from 'react';
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
      <section className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Confirm your spot</h1>
          <p className="auth-subtitle">
            You were conditionally accepted to the CVerse Data Science Academy sponsored cohort. Submit the link to your LinkedIn post here to confirm your spot (within 48 hours of acceptance).
          </p>

          {success ? (
            <div className="success-message">
              <p className="font-semibold m-0">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="confirm-email" className="auth-label">
                  Email address *
                </label>
                <input
                  id="confirm-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Same email you used to apply"
                  className="auth-input"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="confirm-linkedin" className="auth-label">
                  Link to your LinkedIn post *
                </label>
                <input
                  id="confirm-linkedin"
                  type="url"
                  required
                  value={linkedinPostUrl}
                  onChange={(e) => setLinkedinPostUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/..."
                  className="auth-input"
                />
              </div>
              {message && !success && (
                <div className="auth-error" role="alert">{message}</div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="auth-btn"
              >
                {submitting ? 'Submitting...' : 'Confirm my spot'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
