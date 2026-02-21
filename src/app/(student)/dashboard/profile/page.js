'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { LmsCard, LmsPageHeader } from '@/app/components/lms';
import { LmsIcons } from '@/app/components/lms/LmsIcons';
import { getLmsAuthHeaders } from '@/lib/authClient';

const PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PROFILE_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const PROFILE_IMAGE_MAX_MB = 2;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    yearsExperience: '',
    profilePictureUrl: null,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profile', { headers: getLmsAuthHeaders() });
        const data = await res.json();
        if (res.ok && data.profile) {
          const p = data.profile;
          setEmail(p.email ?? '');
          setForm({
            firstName: p.firstName ?? '',
            lastName: p.lastName ?? '',
            phone: p.phone ?? '',
            address: p.address ?? '',
            yearsExperience: p.yearsExperience != null ? String(p.yearsExperience) : '',
            profilePictureUrl: p.profilePictureUrl ?? null,
          });
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const uploadPhoto = async (file) => {
    if (!file || !PROFILE_IMAGE_TYPES.includes(file.type)) {
      setMessage('Please choose a JPG, PNG, or WebP image (max 2MB).');
      return;
    }
    if (file.size > PROFILE_IMAGE_MAX_MB * 1024 * 1024) {
      setMessage(`Image must be under ${PROFILE_IMAGE_MAX_MB}MB.`);
      return;
    }
    setUploading(true);
    setMessage('');
    try {
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          prefix: 'profile',
          allowedTypes: PROFILE_IMAGE_EXTENSIONS,
          maxSizeMb: PROFILE_IMAGE_MAX_MB,
          fileSize: file.size,
        }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error || 'Failed to prepare upload');
      await fetch(presignData.uploadUrl, {
        method: presignData.method || 'PUT',
        headers: presignData.headers || {},
        body: file,
      });
      const fileUrl = presignData.fileUrl;
      setForm((f) => ({ ...f, profilePictureUrl: fileUrl }));
      const patchRes = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify({ profilePictureUrl: fileUrl }),
      });
      if (patchRes.ok) setMessage('Photo updated.');
      else setMessage('Photo uploaded but save failed. Click Save to retry.');
    } catch (e) {
      setMessage(e?.message || 'Upload failed. Try again or use a smaller image.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        address: form.address,
        profilePictureUrl: form.profilePictureUrl || undefined,
      };
      if (form.yearsExperience !== '') {
        const n = parseInt(form.yearsExperience, 10);
        body.yearsExperience = Number.isNaN(n) ? null : n;
      } else {
        body.yearsExperience = null;
      }
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Profile saved.');
      } else {
        setMessage(data.error || 'Failed to save profile.');
      }
    } catch {
      setMessage('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New password and confirm password do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getLmsAuthHeaders() },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage('Password updated successfully.');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMessage(data.error || 'Failed to update password.');
      }
    } catch {
      setPasswordMessage('Something went wrong. Please try again.');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
        <div className="h-24 lms-skeleton rounded-xl" />
        <div className="lms-skeleton rounded-xl" style={{ height: 320 }} />
        <div className="lms-skeleton rounded-xl" style={{ height: 280 }} />
      </div>
    );
  }

  const isMessageError = message && (message.includes('fail') || message.includes('Failed'));
  const inputCls = 'lms-form-input border-token w-full px-4 py-3';
  const textareaCls = 'lms-form-textarea border-token w-full px-4 py-3 resize-y';

  return (
    <div className="profile-page flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
      <LmsPageHeader
        title="Profile"
        subtitle="Update your name, contact details, and photo."
        icon={LmsIcons.users}
      />

      <LmsCard accent="primary" hoverable={false}>
        {message && (
          <div className={`lms-alert mb-6 ${isMessageError ? 'lms-alert-error' : 'lms-alert-success'}`} role="alert" aria-live="polite">
            {message}
          </div>
        )}
        <form onSubmit={handleSave} className="flex flex-col" style={{ gap: 'var(--lms-space-8)' }}>
          {/* Photo + Identity */}
          <div className="profile-hero">
            <div className="profile-hero-avatar-wrap">
              <div
                className="profile-hero-avatar"
                style={{
                  background: form.profilePictureUrl ? 'transparent' : 'linear-gradient(135deg, var(--primary-color), #00a67e)',
                  color: 'white',
                }}
              >
                {form.profilePictureUrl ? (
                  <img src={form.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (form.firstName || form.lastName || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <input ref={fileInputRef} type="file" accept={PROFILE_IMAGE_TYPES.join(',')} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
              <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="profile-hero-change-btn">
                {uploading ? 'Uploading…' : 'Change photo'}
              </button>
              <span className="profile-hero-hint">JPG, PNG or WebP · Max {PROFILE_IMAGE_MAX_MB}MB</span>
            </div>
            <div className="profile-hero-details">
              <h2 className="profile-hero-name" title={form.firstName || form.lastName ? `${form.firstName} ${form.lastName}`.trim() : 'Your Name'}>
                {form.firstName || form.lastName ? `${form.firstName} ${form.lastName}`.trim() : 'Your Name'}
              </h2>
              {email && <p className="profile-hero-meta truncate" title={email}>{email}</p>}
              <p className="profile-hero-meta">
                {form.yearsExperience ? `${form.yearsExperience} years experience` : 'Student at CVERSE Academy'}
              </p>
              {form.phone && <p className="profile-hero-meta">{form.phone}</p>}
              <Link
                href="/dashboard/certificates"
                className="profile-hero-certificates-btn inline-flex items-center gap-2 mt-8 px-3 py-1.5 rounded-lg text-[0.8125rem] font-medium text-[var(--primary-color)] bg-transparent border border-[var(--neutral-300)] no-underline hover:bg-[var(--neutral-50)] hover:border-[var(--primary-color)] transition-[border-color,background] duration-200"
              >
                <span className="shrink-0 text-[var(--primary-color)]" aria-hidden>{LmsIcons.trophy}</span>
                View certificates
              </Link>
            </div>
          </div>

          {/* Personal Info */}
          <div className="profile-section">
            <h3 className="lms-section-title">Personal Information</h3>
            <div className="grid sm:grid-cols-2" style={{ gap: 'var(--lms-space-5)' }}>
              <div>
                <label htmlFor="profile-firstName" className="lms-form-label block mb-1.5">First name</label>
                <input id="profile-firstName" type="text" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label htmlFor="profile-lastName" className="lms-form-label block mb-1.5">Last name</label>
                <input id="profile-lastName" type="text" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="profile-section">
            <h3 className="lms-section-title">Contact Details</h3>
            <div className="grid sm:grid-cols-2" style={{ gap: 'var(--lms-space-5)' }}>
              <div>
                <label htmlFor="profile-phone" className="lms-form-label block mb-1.5">Phone number</label>
                <input id="profile-phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label htmlFor="profile-yearsExperience" className="lms-form-label block mb-1.5">Years of experience</label>
                <input id="profile-yearsExperience" type="number" min={0} max={100} value={form.yearsExperience} onChange={(e) => setForm((f) => ({ ...f, yearsExperience: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div style={{ marginTop: 'var(--lms-space-5)' }}>
              <label htmlFor="profile-address" className="lms-form-label block mb-1.5">Address</label>
              <textarea id="profile-address" rows={3} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className={textareaCls} />
            </div>
          </div>

          <div className="profile-section pt-2">
            <button type="submit" disabled={saving} className="lms-btn lms-btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', minHeight: '48px', borderRadius: '12px' }}>
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>
      </LmsCard>

      {/* Security */}
      <LmsCard title="Security" subtitle="Change your account password" accent="warning" hoverable={false}>
        {passwordMessage && (
          <div className={`lms-alert mb-6 ${passwordMessage.includes('success') ? 'lms-alert-success' : 'lms-alert-error'}`} role="alert" aria-live="polite">
            {passwordMessage}
          </div>
        )}
        <form onSubmit={handleChangePassword} className="flex flex-col max-w-md" style={{ gap: 'var(--lms-space-6)' }}>
          <div>
            <label htmlFor="current-password" className="lms-form-label block mb-1.5">Current password</label>
            <div className="relative">
              <input id="current-password" type={showCurrentPw ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} className={`${inputCls} profile-pw-input`} autoComplete="current-password" />
              <button type="button" onClick={() => setShowCurrentPw((s) => !s)} className="profile-pw-toggle" aria-label={showCurrentPw ? 'Hide password' : 'Show password'} tabIndex={-1}>
                {showCurrentPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="new-password" className="lms-form-label block mb-1.5">New password</label>
            <div className="relative">
              <input id="new-password" type={showNewPw ? 'text' : 'password'} value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} className={`${inputCls} profile-pw-input`} autoComplete="new-password" />
              <button type="button" onClick={() => setShowNewPw((s) => !s)} className="profile-pw-toggle" aria-label={showNewPw ? 'Hide password' : 'Show password'} tabIndex={-1}>
                {showNewPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'var(--neutral-400)' }}>At least 8 characters.</p>
          </div>
          <div>
            <label htmlFor="confirm-password" className="lms-form-label block mb-1.5">Confirm new password</label>
            <div className="relative">
              <input id="confirm-password" type={showConfirmPw ? 'text' : 'password'} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))} className={`${inputCls} profile-pw-input`} autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirmPw((s) => !s)} className="profile-pw-toggle" aria-label={showConfirmPw ? 'Hide password' : 'Show password'} tabIndex={-1}>
                {showConfirmPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>
          <button type="submit" disabled={passwordSaving} className="lms-btn lms-btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', minHeight: '48px', borderRadius: '12px' }}>
            {passwordSaving ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </LmsCard>
    </div>
  );
}
