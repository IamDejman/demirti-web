'use client';

import { useState } from 'react';
import { useToast } from './ToastProvider';

const MAX_ESSAY_WORDS = 300;
const ESSAY_QUESTION = 'Why are you pursuing data science now, and what will you sacrifice or rearrange in your schedule to complete this program?';

function countWords(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isValidLinkedInUrl(url) {
  if (!url || !url.trim()) return false;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase();
    return (host === 'linkedin.com' || host === 'www.linkedin.com') && u.pathname.toLowerCase().startsWith('/in/');
  } catch {
    return false;
  }
}

export default function SponsoredApplicationForm({ cohortName = 'Data Science Feb 2026' }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    city: '',
    status: '',
    statusOther: '',
    essay: '',
    ackLinkedin48h: false,
    ackCommitment: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const essayWordCount = countWords(formData.essay);
  const essayOverLimit = essayWordCount > MAX_ESSAY_WORDS;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (essayOverLimit) {
      showToast({
        type: 'error',
        message: `Essay must be ${MAX_ESSAY_WORDS} words or fewer (currently ${essayWordCount}).`
      });
      return;
    }
    if (countWords(formData.essay) < 1) {
      showToast({ type: 'error', message: 'Please write your essay.' });
      return;
    }
    if (!formData.status) {
      showToast({ type: 'error', message: 'Status is required.' });
      return;
    }
    if (formData.status === 'Others' && !formData.statusOther?.trim()) {
      showToast({ type: 'error', message: 'Please specify your status.' });
      return;
    }
    if (!formData.city?.trim()) {
      showToast({ type: 'error', message: 'City of Residence is required.' });
      return;
    }
    if (!formData.linkedinUrl?.trim()) {
      showToast({ type: 'error', message: 'LinkedIn Profile URL is required.' });
      return;
    }
    if (!isValidLinkedInUrl(formData.linkedinUrl)) {
      showToast({
        type: 'error',
        message: 'Please enter a valid LinkedIn profile URL (e.g. https://linkedin.com/in/yourprofile).'
      });
      return;
    }
    if (!formData.ackLinkedin48h || !formData.ackCommitment) {
      showToast({
        type: 'error',
        message: 'Please check both acknowledgement boxes to continue.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/save-sponsored-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          linkedinUrl: formData.linkedinUrl.trim(),
          city: formData.city.trim(),
          status: formData.status,
          statusOther: formData.status === 'Others' ? formData.statusOther.trim() : undefined,
          essay: formData.essay.trim(),
          ackLinkedin48h: formData.ackLinkedin48h,
          ackCommitment: formData.ackCommitment,
          cohortName
        })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast({
          type: 'error',
          message: data.error || 'Failed to submit application.'
        });
        return;
      }
      setSubmitted(true);
      showToast({
        type: 'success',
        message: "Application received. We'll review and get back to you."
      });
    } catch (err) {
      console.error(err);
      showToast({
        type: 'error',
        message: 'Something went wrong. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#e8f5e9',
        borderRadius: '12px',
        border: '1px solid #c8e6c9'
      }}>
        <h3 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>Application received</h3>
        <p style={{ color: '#1b5e20', margin: 0 }}>
          Thank you for applying. We&apos;ll review your application and get back to you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="firstName" style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem' }}>
          First Name *
        </label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          required
          value={formData.firstName}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="lastName" style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem' }}>
          Last Name *
        </label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          required
          value={formData.lastName}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="email" style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem' }}>
          Email Address *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="phone" style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem' }}>
          Phone Number *
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          value={formData.phone}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="linkedinUrl" style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem' }}>
          LinkedIn Profile URL *
        </label>
        <input
          id="linkedinUrl"
          name="linkedinUrl"
          type="url"
          required
          placeholder="https://linkedin.com/in/..."
          value={formData.linkedinUrl}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="city" style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem' }}>
          City of Residence *
        </label>
        <input
          id="city"
          name="city"
          type="text"
          required
          value={formData.city}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="status" style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem' }}>
          Status *
        </label>
        <select
          id="status"
          name="status"
          required
          value={formData.status}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          <option value="">Select status</option>
          <option value="Employed">Employed</option>
          <option value="Student">Student</option>
          <option value="Job-seeking">Job-seeking</option>
          <option value="Others">Others</option>
        </select>
        {formData.status === 'Others' && (
          <div style={{ marginTop: '0.75rem' }}>
            <label htmlFor="statusOther" style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
              Please specify *
            </label>
            <input
              id="statusOther"
              name="statusOther"
              type="text"
              required
              placeholder="Your status"
              value={formData.statusOther}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
            />
          </div>
        )}
      </div>
      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="essay" style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem' }}>
          Essay Question *
        </label>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>{ESSAY_QUESTION}</p>
        <textarea
          id="essay"
          name="essay"
          required
          rows={6}
          value={formData.essay}
          onChange={handleChange}
          maxLength={2000}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: essayOverLimit ? '2px solid #d32f2f' : '1px solid #ccc',
            boxSizing: 'border-box'
          }}
        />
        <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: essayOverLimit ? '#d32f2f' : '#666' }}>
          {essayWordCount} / {MAX_ESSAY_WORDS} words (max 300 words)
        </p>
      </div>
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="ackLinkedin48h"
            checked={formData.ackLinkedin48h}
            onChange={handleChange}
          />
          <span>
            I understand that if selected, I must publish a LinkedIn post confirming my acceptance within 48 hours to secure my spot.
          </span>
        </label>
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="ackCommitment"
            checked={formData.ackCommitment}
            onChange={handleChange}
          />
          <span>
            I confirm that I can commit to the full duration of the program and understand that this sponsored opportunity is limited.
          </span>
        </label>
      </div>
      <button
        type="submit"
        disabled={isSubmitting || essayOverLimit}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: isSubmitting || essayOverLimit ? '#ccc' : '#0066cc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: isSubmitting || essayOverLimit ? 'not-allowed' : 'pointer'
        }}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  );
}
