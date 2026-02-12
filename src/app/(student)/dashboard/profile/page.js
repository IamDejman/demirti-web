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

  return (
    <div className="space-y-8">
      <LmsPageHeader
        title="Profile"
        subtitle="Update your name, contact details, and photo."
        icon={LmsIcons.users}
        breadcrumb={{ href: '/dashboard', label: 'Dashboard' }}
      />

      <LmsCard title="Profile details">
        {message && (
          <p className="text-sm text-gray-600 mb-4" role="alert">
            {message}
          </p>
        )}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col items-start gap-3">
              <label className="text-sm font-medium" style={{ color: 'var(--neutral-700)' }}>Profile photo</label>
              <div className="flex items-center gap-5">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-semibold overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.1), rgba(0, 166, 126, 0.08))', color: 'var(--primary-color)', border: '3px solid var(--neutral-100)' }}
                >
                  {form.profilePictureUrl ? (
                    <img src={form.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (form.firstName || form.lastName || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={PROFILE_IMAGE_TYPES.join(',')}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadPhoto(f);
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="lms-btn lms-btn-secondary lms-btn-sm"
                  >
                    {uploading ? 'Uploading...' : 'Upload photo'}
                  </button>
                  <p className="text-xs" style={{ color: 'var(--neutral-500)' }}>JPG, PNG or WebP. Max {PROFILE_IMAGE_MAX_MB}MB.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First name
              </label>
              <input
                id="profile-firstName"
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="profile-lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last name
              </label>
              <input
                id="profile-lastName"
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone number
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="profile-address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              id="profile-address"
              rows={2}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="profile-yearsExperience" className="block text-sm font-medium text-gray-700 mb-1">
              Years of experience
            </label>
            <input
              id="profile-yearsExperience"
              type="number"
              min={0}
              max={100}
              value={form.yearsExperience}
              onChange={(e) => setForm((f) => ({ ...f, yearsExperience: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="lms-btn lms-btn-primary"
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </LmsCard>

      <LmsCard title="Change password">
        {passwordMessage && (
          <p className="text-sm text-gray-600 mb-4" role="alert">
            {passwordMessage}
          </p>
        )}
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
              Current password
            </label>
            <input
              id="current-password"
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              id="new-password"
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              autoComplete="new-password"
            />
            <p className="text-xs text-gray-500 mt-1">At least 8 characters.</p>
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              autoComplete="new-password"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="show-passwords"
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="show-passwords" className="text-sm text-gray-700">
              Show passwords
            </label>
          </div>
          <button
            type="submit"
            disabled={passwordSaving}
            className="lms-btn lms-btn-primary"
          >
            {passwordSaving ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </LmsCard>
    </div>
  );
}
