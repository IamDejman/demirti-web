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
            <div className="flex flex-col items-start gap-2">
              <label className="text-sm font-medium text-gray-700">Profile photo</label>
              <div className="flex items-center gap-4">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-semibold overflow-hidden bg-primary/10 text-primary"
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
                    className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload photo'}
                  </button>
                  <p className="text-xs text-gray-500">JPG, PNG or WebP. Max {PROFILE_IMAGE_MAX_MB}MB.</p>
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
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </LmsCard>
    </div>
  );
}
