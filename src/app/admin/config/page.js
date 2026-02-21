'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';
import { AdminPageHeader } from '../../components/admin';
import TrackConfigSection from './TrackConfigSection';
import AdminManagementSection from './AdminManagementSection';

export default function ConfigPage() {
  const [tracks, setTracks] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [activeTab, setActiveTab] = useState('tracks'); // 'tracks' or 'admins'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [adminFormData, setAdminFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const router = useRouter();
  const { showToast } = useToast();

  // Check authentication on mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
  }, [router]);


  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    setLoading(true);
    try {
      const [tracksRes, adminsRes] = await Promise.all([
        fetch('/api/track-config'),
        fetch('/api/admin/admins'),
      ]);
      const [tracksData, adminsData] = await Promise.all([tracksRes.json(), adminsRes.json()]);
      if (tracksData.tracks) {
        const tracksWithFormData = tracksData.tracks.map(track => ({
          ...track,
          formData: {
            coursePrice: track.course_price || 150000,
            scholarshipLimit: track.scholarship_limit || 10,
            scholarshipDiscountPercentage: track.scholarship_discount_percentage || 50,
            isActive: track.is_active !== false
          }
        }));
        setTracks(tracksWithFormData);
      }
      if (adminsData.success) setAdmins(adminsData.admins);
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to load configuration'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTracks = async () => {
    try {
      const response = await fetch('/api/track-config');
      const data = await response.json();
      
      if (data.tracks) {
        const tracksWithFormData = data.tracks.map(track => ({
          ...track,
          formData: {
            coursePrice: track.course_price || 150000,
            scholarshipLimit: track.scholarship_limit || 10,
            scholarshipDiscountPercentage: track.scholarship_discount_percentage || 50,
            isActive: track.is_active !== false
          }
        }));
        setTracks(tracksWithFormData);
      }
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to load track configurations'
      });
    }
  };

  const loadAdmins = async () => {
    try {
      const response = await fetch('/api/admin/admins');
      const data = await response.json();
      if (data.success) setAdmins(data.admins);
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to load admins'
      });
    }
  };

  const handleInputChange = (trackName, field, value) => {
    setTracks(prevTracks => 
      prevTracks.map(track => 
        track.track_name === trackName
          ? {
              ...track,
              formData: {
                ...track.formData,
                [field]: field === 'isActive' ? value : (field === 'coursePrice' || field === 'scholarshipLimit' ? parseInt(value) || 0 : parseFloat(value) || 0)
              }
            }
          : track
      )
    );
  };

  const handleSave = async (trackName) => {
    setSaving(prev => ({ ...prev, [trackName]: true }));
    
    try {
      const track = tracks.find(t => t.track_name === trackName);
      if (!track) return;

      const updates = {
        coursePrice: track.formData.coursePrice,
        scholarshipLimit: track.formData.scholarshipLimit,
        scholarshipDiscountPercentage: track.formData.scholarshipDiscountPercentage,
        isActive: track.formData.isActive
      };

      const response = await fetch('/api/track-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackName,
          ...updates
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          type: 'success',
          message: `${trackName} configuration saved successfully!`
        });
        
        // Reload tracks to get updated values
        await loadTracks();
      } else {
        showToast({
          type: 'error',
          message: data.error || 'Failed to save configuration'
        });
      }
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to save configuration'
      });
    } finally {
      setSaving(prev => ({ ...prev, [trackName]: false }));
    }
  };

  // Format currency - course prices are stored in Naira, not kobo
  const formatCurrency = (amount) => {
    if (!amount) return '₦0';
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleAdminInputChange = (field, value) => {
    setAdminFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateAdmin = async () => {
    if (!adminFormData.email || !adminFormData.password) {
      showToast({
        type: 'error',
        message: 'Email and password are required'
      });
      return;
    }

    setSaving(prev => ({ ...prev, admin: true }));

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminFormData),
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          type: 'success',
          message: 'Admin created successfully!'
        });
        setShowAdminForm(false);
        setShowPassword(false);
        setAdminFormData({ email: '', password: '', firstName: '', lastName: '' });
        await loadAdmins();
      } else {
        showToast({
          type: 'error',
          message: data.error || 'Failed to create admin'
        });
      }
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to create admin'
      });
    } finally {
      setSaving(prev => ({ ...prev, admin: false }));
    }
  };

  const handleUpdateAdmin = async (id, updates) => {
    setSaving(prev => ({ ...prev, [`admin-${id}`]: true }));

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          type: 'success',
          message: 'Admin updated successfully!'
        });
        setEditingAdmin(null);
        setShowAdminForm(false);
        setShowPassword(false);
        setAdminFormData({ email: '', password: '', firstName: '', lastName: '' });
        await loadAdmins();
      } else {
        showToast({
          type: 'error',
          message: data.error || 'Failed to update admin'
        });
      }
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to update admin'
      });
    } finally {
      setSaving(prev => ({ ...prev, [`admin-${id}`]: false }));
    }
  };

  const handleToggleAdminStatus = async (id, isActive) => {
    try {
      const response = await fetch('/api/admin/admins', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action: isActive ? 'disable' : 'enable' }),
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          type: 'success',
          message: `Admin ${isActive ? 'disabled' : 'enabled'} successfully!`
        });
        await loadAdmins();
      } else {
        showToast({
          type: 'error',
          message: data.error || 'Failed to update admin status'
        });
      }
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to update admin status'
      });
    }
  };

  return (
    <div className="admin-dashboard admin-content-area">
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <AdminPageHeader
            title="Configuration"
            description="Manage track settings, pricing, and admin accounts."
          />

          {/* Tabs */}
          <div
            className="admin-config-tabs"
            style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              borderBottom: '2px solid #e1e4e8',
            }}
          >
            <button
              onClick={() => setActiveTab('tracks')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: activeTab === 'tracks' ? '#0066cc' : 'transparent',
                color: activeTab === 'tracks' ? 'white' : '#666',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.3s ease'
              }}
            >
              Track Configuration
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: activeTab === 'admins' ? '#0066cc' : 'transparent',
                color: activeTab === 'admins' ? 'white' : '#666',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.3s ease'
              }}
            >
              Admin Management
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <p style={{ fontSize: '1.25rem', color: '#666' }}>Loading configurations...</p>
            </div>
          ) : activeTab === 'tracks' ? (
            <TrackConfigSection
              tracks={tracks}
              saving={saving}
              handleInputChange={handleInputChange}
              handleSave={handleSave}
              formatCurrency={formatCurrency}
            />
          ) : (
            <AdminManagementSection
              admins={admins}
              saving={saving}
              showAdminForm={showAdminForm}
              setShowAdminForm={setShowAdminForm}
              editingAdmin={editingAdmin}
              setEditingAdmin={setEditingAdmin}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              adminFormData={adminFormData}
              setAdminFormData={setAdminFormData}
              handleAdminInputChange={handleAdminInputChange}
              handleCreateAdmin={handleCreateAdmin}
              handleUpdateAdmin={handleUpdateAdmin}
              handleToggleAdminStatus={handleToggleAdminStatus}
              formatDate={formatDate}
            />
          )}
        </div>
      </div>
  );
}

