'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '../../components/AdminNavbar';
import Link from 'next/link';
import { useToast } from '../../components/ToastProvider';

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
    loadTracks();
    loadAdmins();
  }, []);

  const loadTracks = async () => {
    try {
      const response = await fetch('/api/track-config');
      const data = await response.json();
      
      if (data.tracks) {
        // Initialize form data with current values
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
    } catch (error) {
      console.error('Error loading tracks:', error);
      showToast({
        type: 'error',
        message: 'Failed to load track configurations'
      });
    }
  };

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/admins');
      const data = await response.json();
      
      if (data.success) {
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
      showToast({
        type: 'error',
        message: 'Failed to load admins'
      });
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error('Error saving track config:', error);
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
    } catch (error) {
      console.error('Error creating admin:', error);
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
    } catch (error) {
      console.error('Error updating admin:', error);
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
    } catch (error) {
      console.error('Error updating admin status:', error);
      showToast({
        type: 'error',
        message: 'Failed to update admin status'
      });
    }
  };

  return (
    <main>
      <AdminNavbar />
      <div className="admin-dashboard admin-content-area">
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: '#1a1a1a',
              margin: 0
            }}>
              Configuration
            </h1>
          </div>

          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '2rem',
            borderBottom: '2px solid #e1e4e8'
          }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {tracks.map((track) => (
                <div
                  key={track.track_name}
                  style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: `2px solid ${track.formData.isActive ? '#00c896' : '#e1e4e8'}`,
                    borderLeft: `6px solid ${track.formData.isActive ? '#00c896' : '#dc3545'}`
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                  }}>
                    <h2 style={{ 
                      fontSize: '1.75rem', 
                      fontWeight: '700', 
                      color: '#1a1a1a',
                      margin: 0
                    }}>
                      {track.track_name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={track.formData.isActive}
                          onChange={(e) => handleInputChange(track.track_name, 'isActive', e.target.checked)}
                          style={{
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            accentColor: '#00c896'
                          }}
                        />
                        <span style={{ 
                          fontWeight: '600',
                          color: track.formData.isActive ? '#00c896' : '#666'
                        }}>
                          {track.formData.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    {/* Course Price */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ 
                        fontWeight: '600', 
                        color: '#666',
                        fontSize: '0.9rem'
                      }}>
                        Course Price (in Naira)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute',
                          left: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#666',
                          fontWeight: '600'
                        }}>
                          ₦
                        </span>
                        <input
                          type="number"
                          value={track.formData.coursePrice}
                          onChange={(e) => handleInputChange(track.track_name, 'coursePrice', e.target.value)}
                          placeholder="150000"
                          style={{
                            width: '100%',
                            padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                            border: '2px solid #e1e4e8',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            transition: 'all 0.3s ease'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#0066cc';
                            e.target.style.outline = 'none';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e1e4e8';
                          }}
                        />
                      </div>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.85rem', 
                        color: '#999',
                        fontStyle: 'italic'
                      }}>
                        Current: {formatCurrency(track.course_price || 0)} (Enter amount in Naira, e.g., 150000 for ₦150,000)
                      </p>
                    </div>

                    {/* Scholarship Limit */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ 
                        fontWeight: '600', 
                        color: '#666',
                        fontSize: '0.9rem'
                      }}>
                        Scholarship Limit
                      </label>
                      <input
                        type="number"
                        value={track.formData.scholarshipLimit}
                        onChange={(e) => handleInputChange(track.track_name, 'scholarshipLimit', e.target.value)}
                        placeholder="10"
                        min="0"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e1e4e8',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#0066cc';
                          e.target.style.outline = 'none';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e1e4e8';
                        }}
                      />
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.85rem', 
                        color: '#999',
                        fontStyle: 'italic'
                      }}>
                        Number of scholarship slots available
                      </p>
                    </div>

                    {/* Scholarship Discount Percentage */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ 
                        fontWeight: '600', 
                        color: '#666',
                        fontSize: '0.9rem'
                      }}>
                        Scholarship Discount (%)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          value={track.formData.scholarshipDiscountPercentage}
                          onChange={(e) => handleInputChange(track.track_name, 'scholarshipDiscountPercentage', e.target.value)}
                          placeholder="50"
                          min="0"
                          max="100"
                          step="0.01"
                          style={{
                            width: '100%',
                            padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                            border: '2px solid #e1e4e8',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            transition: 'all 0.3s ease'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#0066cc';
                            e.target.style.outline = 'none';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e1e4e8';
                          }}
                        />
                        <span style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#666',
                          fontWeight: '600'
                        }}>
                          %
                        </span>
                      </div>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.85rem', 
                        color: '#999',
                        fontStyle: 'italic'
                      }}>
                        Discount percentage for scholarship recipients
                      </p>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '2px solid #f0f0f0'
                  }}>
                    <button
                      onClick={() => handleSave(track.track_name)}
                      disabled={saving[track.track_name]}
                      style={{
                        padding: '0.75rem 2rem',
                        backgroundColor: saving[track.track_name] ? '#999' : '#00c896',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        cursor: saving[track.track_name] ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        minWidth: '120px'
                      }}
                      onMouseEnter={(e) => {
                        if (!saving[track.track_name]) {
                          e.target.style.backgroundColor = '#00a67d';
                          e.target.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!saving[track.track_name]) {
                          e.target.style.backgroundColor = '#00c896';
                          e.target.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      {saving[track.track_name] ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ))}

              {tracks.length === 0 && (
                <div style={{
                  backgroundColor: 'white',
                  padding: '3rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: '1.1rem', color: '#666' }}>
                    No tracks configured yet
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Admin Management Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Create Admin Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
                  Admin Accounts
                </h2>
                <button
                  onClick={() => {
                    setShowAdminForm(!showAdminForm);
                    setEditingAdmin(null);
                    setShowPassword(false);
                    setAdminFormData({ email: '', password: '', firstName: '', lastName: '' });
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#00c896',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#00a67d';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#00c896';
                  }}
                >
                  {showAdminForm ? 'Cancel' : '+ Create Admin'}
                </button>
              </div>

              {/* Create Admin Form */}
              {showAdminForm && (
                <div style={{
                  backgroundColor: 'white',
                  padding: '2rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '2px solid #00c896'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
                    {editingAdmin ? 'Edit Admin' : 'Create New Admin'}
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        Email Address <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="email"
                        value={adminFormData.email}
                        onChange={(e) => handleAdminInputChange('email', e.target.value)}
                        disabled={!!editingAdmin}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e1e4e8',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        Password <span style={{ color: 'red' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={adminFormData.password}
                          onChange={(e) => handleAdminInputChange('password', e.target.value)}
                          placeholder={editingAdmin ? 'Leave blank to keep current' : 'Enter password'}
                          style={{
                            width: '100%',
                            padding: '0.75rem 4.5rem 0.75rem 0.75rem',
                            border: '2px solid #e1e4e8',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            boxSizing: 'border-box'
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowPassword(!showPassword);
                          }}
                          style={{
                            position: 'absolute',
                            right: '0.5rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#666',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            padding: '0.5rem 0.75rem',
                            minWidth: '60px',
                            minHeight: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            userSelect: 'none',
                            zIndex: 10,
                            pointerEvents: 'auto'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = '#0066cc';
                            e.target.style.backgroundColor = '#f0f0f0';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = '#666';
                            e.target.style.backgroundColor = 'transparent';
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            e.target.style.color = '#0066cc';
                            e.target.style.backgroundColor = '#f0f0f0';
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            setShowPassword(!showPassword);
                            e.target.style.color = '#666';
                            e.target.style.backgroundColor = 'transparent';
                          }}
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        First Name
                      </label>
                      <input
                        type="text"
                        value={adminFormData.firstName}
                        onChange={(e) => handleAdminInputChange('firstName', e.target.value)}
                        placeholder="First name"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e1e4e8',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={adminFormData.lastName}
                        onChange={(e) => handleAdminInputChange('lastName', e.target.value)}
                        placeholder="Last name"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e1e4e8',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                      onClick={() => {
                        setShowAdminForm(false);
                        setEditingAdmin(null);
                        setShowPassword(false);
                        setAdminFormData({ email: '', password: '', firstName: '', lastName: '' });
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#e1e4e8',
                        color: '#666',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={editingAdmin ? () => handleUpdateAdmin(editingAdmin.id, adminFormData) : handleCreateAdmin}
                      disabled={saving.admin}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: saving.admin ? '#999' : '#00c896',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        cursor: saving.admin ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {saving.admin ? 'Saving...' : (editingAdmin ? 'Update Admin' : 'Create Admin')}
                    </button>
                  </div>
                </div>
              )}

              {/* Admins List */}
              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
                  All Admins ({admins.length})
                </h3>

                {admins.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    No admins found. Create your first admin account.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e1e4e8', backgroundColor: '#f8f9fa' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Email</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Name</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Status</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Last Login</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Created</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admins.map((admin) => (
                          <tr key={admin.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '0.75rem', color: '#1a1a1a', fontWeight: '600' }}>
                              {admin.email}
                            </td>
                            <td style={{ padding: '0.75rem', color: '#1a1a1a' }}>
                              {admin.firstName || admin.lastName 
                                ? `${admin.firstName || ''} ${admin.lastName || ''}`.trim()
                                : 'N/A'}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                backgroundColor: admin.isActive ? '#d4edda' : '#f8d7da',
                                color: admin.isActive ? '#155724' : '#721c24'
                              }}>
                                {admin.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                              {formatDate(admin.lastLogin)}
                            </td>
                            <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                              {formatDate(admin.createdAt)}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => {
                                    setEditingAdmin(admin);
                                    setShowPassword(false);
                                    setAdminFormData({
                                      email: admin.email,
                                      password: '',
                                      firstName: admin.firstName || '',
                                      lastName: admin.lastName || ''
                                    });
                                    setShowAdminForm(true);
                                  }}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#0066cc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleToggleAdminStatus(admin.id, admin.isActive)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: admin.isActive ? '#dc3545' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                  }}
                                >
                                  {admin.isActive ? 'Disable' : 'Enable'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

