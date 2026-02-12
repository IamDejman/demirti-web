'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profile', { headers: getLmsAuthHeaders() });
        const data = await res.json();
        if (res.ok && data.profile) {
          const p = data.profile;
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
      <div className="space-y-8">
        <div className="h-10 w-64 lms-skeleton rounded-lg" />
        <div className="h-64 lms-skeleton rounded-xl" />
      </div>
    );
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary';
  const inputSty = { border: '1px solid var(--neutral-200)', color: 'var(--neutral-900)', backgroundColor: 'white' };
  const labelCls = 'block text-sm font-medium mb-1.5';
  const labelSty = { color: 'var(--neutral-700)' };

  return (
    <div className="space-y-8">
      <LmsPageHeader
        title="Profile"
        subtitle="Update your name, contact details, and photo."
        icon={LmsIcons.users}
        breadcrumb={{ href: '/dashboard', label: 'Dashboard' }}
      />

      {/* Photo + Identity Card */}
      <LmsCard accent="primary" hoverable={false}>
        {message && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: message.includes('fail') || message.includes('Failed') ? 'rgba(220,38,38,0.06)' : 'rgba(0,82,163,0.06)', color: message.includes('fail') || message.includes('Failed') ? '#dc2626' : 'var(--primary-color)' }} role="alert">
            {message}
          </div>
        )}
        <form onSubmit={handleSave} className="space-y-8">
          {/* Photo section */}
          <div className="flex flex-col sm:flex-row items-start gap-8 p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.03), rgba(0, 166, 126, 0.02))', border: '1px solid var(--neutral-100)' }}>
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-28 h-28 rounded-2xl flex items-center justify-center text-3xl font-bold overflow-hidden shadow-sm"
                style={{ background: form.profilePictureUrl ? 'transparent' : 'linear-gradient(135deg, var(--primary-color), #00a67e)', color: 'white', border: '3px solid white', boxShadow: '0 4px 12px rgba(0,82,163,0.15)' }}
              >
                {form.profilePictureUrl ? (
                  <img src={form.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (form.firstName || form.lastName || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <input ref={fileInputRef} type="file" accept={PROFILE_IMAGE_TYPES.join(',')} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
              <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="lms-btn lms-btn-sm lms-btn-outline">
                {uploading ? 'Uploading...' : 'Change photo'}
              </button>
              <p className="text-xs text-center" style={{ color: 'var(--neutral-400)' }}>JPG, PNG or WebP. Max {PROFILE_IMAGE_MAX_MB}MB</p>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold" style={{ color: 'var(--neutral-900)' }}>
                {form.firstName || form.lastName ? `${form.firstName} ${form.lastName}`.trim() : 'Your Name'}
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--neutral-500)' }}>
                {form.yearsExperience ? `${form.yearsExperience} years experience` : 'Student at CVERSE Academy'}
              </p>
              {form.phone && <p className="text-sm mt-2" style={{ color: 'var(--neutral-500)' }}>{form.phone}</p>}
            </div>
          </div>

          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--neutral-400)' }}>Personal Information</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-firstName" className={labelCls} style={labelSty}>First name</label>
                <input id="profile-firstName" type="text" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className={inputCls} style={inputSty} />
              </div>
              <div>
                <label htmlFor="profile-lastName" className={labelCls} style={labelSty}>Last name</label>
                <input id="profile-lastName" type="text" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className={inputCls} style={inputSty} />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--neutral-400)' }}>Contact Details</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-phone" className={labelCls} style={labelSty}>Phone number</label>
                <input id="profile-phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} style={inputSty} />
              </div>
              <div>
                <label htmlFor="profile-yearsExperience" className={labelCls} style={labelSty}>Years of experience</label>
                <input id="profile-yearsExperience" type="number" min={0} max={100} value={form.yearsExperience} onChange={(e) => setForm((f) => ({ ...f, yearsExperience: e.target.value }))} className={inputCls} style={inputSty} />
              </div>
            </div>
            <div className="mt-5">
              <label htmlFor="profile-address" className={labelCls} style={labelSty}>Address</label>
              <textarea id="profile-address" rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className={`${inputCls} resize-y`} style={inputSty} />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={saving} className="lms-btn lms-btn-primary">{saving ? 'Saving...' : 'Save profile'}</button>
          </div>
        </form>
      </LmsCard>

      {/* Security */}
      <LmsCard title="Security" subtitle="Change your account password" accent="warning" hoverable={false}>
        {passwordMessage && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: passwordMessage.includes('success') ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.06)', color: passwordMessage.includes('success') ? '#16a34a' : '#dc2626' }} role="alert">
            {passwordMessage}
          </div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
          <div>
            <label htmlFor="current-password" className={labelCls} style={labelSty}>Current password</label>
            <input id="current-password" type={showPasswords ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} className={inputCls} style={inputSty} autoComplete="current-password" />
          </div>
          <div>
            <label htmlFor="new-password" className={labelCls} style={labelSty}>New password</label>
            <input id="new-password" type={showPasswords ? 'text' : 'password'} value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} className={inputCls} style={inputSty} autoComplete="new-password" />
            <p className="text-xs mt-1.5" style={{ color: 'var(--neutral-400)' }}>At least 8 characters.</p>
          </div>
          <div>
            <label htmlFor="confirm-password" className={labelCls} style={labelSty}>Confirm new password</label>
            <input id="confirm-password" type={showPasswords ? 'text' : 'password'} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))} className={inputCls} style={inputSty} autoComplete="new-password" />
          </div>
          <label className="lms-toggle">
            <input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} />
            <span className="lms-toggle-track" />
            <span className="text-sm" style={{ color: 'var(--neutral-600)' }}>Show passwords</span>
          </label>
          <button type="submit" disabled={passwordSaving} className="lms-btn lms-btn-primary">{passwordSaving ? 'Updating...' : 'Update password'}</button>
        </form>
      </LmsCard>
    </div>
  );
}
