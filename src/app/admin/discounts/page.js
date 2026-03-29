'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';
import { AdminPageHeader, AdminButton } from '../../components/admin';

const LABEL_STYLE = {
  display: 'block',
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#6b7280',
  marginBottom: '0.375rem',
};

const VALUE_STYLE = {
  fontSize: '0.9375rem',
  color: '#111827',
};

const CARD_STYLE = {
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#fff',
  padding: '1.25rem',
};

function StatusBadge({ active }) {
  const color = active ? '#059669' : '#6b7280';
  const bg = active ? 'rgba(5, 150, 105, 0.1)' : 'rgba(107, 114, 128, 0.1)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.3rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 20,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      ...CARD_STYLE,
      borderTop: `3px solid ${color}`,
      flex: '1 1 200px',
      minWidth: 160,
    }}>
      <div style={LABEL_STYLE}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>
        {value}
      </div>
    </div>
  );
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    percentage: ''
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/discounts');
      const data = await response.json();

      if (data.success) {
        setDiscounts(data.discounts);
      }
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to load discounts'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.percentage) {
      showToast({
        type: 'error',
        message: 'Name and percentage are required'
      });
      return;
    }

    const percentage = parseFloat(formData.percentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      showToast({
        type: 'error',
        message: 'Percentage must be between 0 and 100'
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          type: 'success',
          message: 'Discount created successfully!'
        });
        setShowForm(false);
        setFormData({ name: '', percentage: '' });
        await loadDiscounts();
      } else {
        showToast({
          type: 'error',
          message: data.error || 'Failed to create discount'
        });
      }
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to create discount'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingDiscount) return;

    if (!formData.name || !formData.percentage) {
      showToast({
        type: 'error',
        message: 'Name and percentage are required'
      });
      return;
    }

    const percentage = parseFloat(formData.percentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      showToast({
        type: 'error',
        message: 'Percentage must be between 0 and 100'
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/discounts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingDiscount.id,
          name: formData.name,
          percentage: formData.percentage
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          type: 'success',
          message: 'Discount updated successfully!'
        });
        setShowForm(false);
        setEditingDiscount(null);
        setFormData({ name: '', percentage: '' });
        await loadDiscounts();
      } else {
        showToast({
          type: 'error',
          message: data.error || 'Failed to update discount'
        });
      }
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to update discount'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      percentage: discount.percentage.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discount?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/discounts?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          type: 'success',
          message: 'Discount deleted successfully!'
        });
        await loadDiscounts();
      } else {
        showToast({
          type: 'error',
          message: data.error || 'Failed to delete discount'
        });
      }
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to delete discount'
      });
    }
  };

  const handleToggleStatus = async (discount) => {
    try {
      const response = await fetch('/api/admin/discounts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: discount.id,
          isActive: !discount.is_active
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          type: 'success',
          message: `Discount ${discount.is_active ? 'deactivated' : 'activated'} successfully!`
        });
        await loadDiscounts();
      } else {
        showToast({
          type: 'error',
          message: data.error || 'Failed to update discount status'
        });
      }
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to update discount status'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const activeCount = discounts.filter(d => d.is_active).length;
  const inactiveCount = discounts.filter(d => !d.is_active).length;

  return (
    <div className="admin-dashboard admin-content-area">
      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <AdminPageHeader
          title="Discounts"
          description="Create and manage discount codes for applications."
          actions={
            <AdminButton
              variant={showForm ? 'secondary' : 'primary'}
              onClick={() => {
                setShowForm(!showForm);
                setEditingDiscount(null);
                setFormData({ name: '', percentage: '' });
              }}
            >
              {showForm ? 'Cancel' : 'Create Discount'}
            </AdminButton>
          }
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>Loading...</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <StatCard label="Total Discounts" value={discounts.length} color="#0052a3" />
              <StatCard label="Active" value={activeCount} color="#059669" />
              <StatCard label="Inactive" value={inactiveCount} color="#6b7280" />
            </div>

            {/* Create/Edit Form */}
            {showForm && (
              <div style={{
                ...CARD_STYLE,
                borderTop: '3px solid #0052a3',
                marginBottom: '1.5rem',
                padding: '1.5rem',
              }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: '#111827' }}>
                  {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={LABEL_STYLE}>
                      Discount Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Early Bird, Summer Sale"
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        fontSize: '0.9375rem',
                        color: '#111827',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={LABEL_STYLE}>
                      Discount Percentage <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        value={formData.percentage}
                        onChange={(e) => handleInputChange('percentage', e.target.value)}
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.01"
                        style={{
                          width: '100%',
                          padding: '0.625rem 2.5rem 0.625rem 0.75rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          fontSize: '0.9375rem',
                          color: '#111827',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                      <span style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6b7280',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}>
                        %
                      </span>
                    </div>
                    <p style={{ margin: '0.375rem 0 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                      Enter a value between 0 and 100
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <AdminButton
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false);
                      setEditingDiscount(null);
                      setFormData({ name: '', percentage: '' });
                    }}
                  >
                    Cancel
                  </AdminButton>
                  <AdminButton
                    variant="primary"
                    onClick={editingDiscount ? handleUpdate : handleCreate}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingDiscount ? 'Update Discount' : 'Create Discount')}
                  </AdminButton>
                </div>
              </div>
            )}

            {/* Discounts List */}
            <div style={{ ...CARD_STYLE, padding: 0 }}>
              <div style={{ padding: '1.25rem 1.25rem 0.75rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  All Discounts ({discounts.length})
                </h2>
              </div>

              {discounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1.25rem', color: '#6b7280' }}>
                  No discounts found. Create your first discount.
                </div>
              ) : (
                <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {discounts.map((discount) => (
                    <div
                      key={discount.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        flexWrap: 'wrap',
                        background: '#fff',
                      }}
                    >
                      {/* Name */}
                      <div style={{ flex: '1 1 180px', minWidth: 140 }}>
                        <div style={LABEL_STYLE}>Name</div>
                        <div style={{ ...VALUE_STYLE, fontWeight: 600 }}>{discount.name}</div>
                      </div>

                      {/* Percentage */}
                      <div style={{ flex: '0 0 100px' }}>
                        <div style={LABEL_STYLE}>Percentage</div>
                        <div style={VALUE_STYLE}>{parseFloat(discount.percentage).toFixed(2)}%</div>
                      </div>

                      {/* Status */}
                      <div style={{ flex: '0 0 110px' }}>
                        <div style={LABEL_STYLE}>Status</div>
                        <StatusBadge active={discount.is_active} />
                      </div>

                      {/* Created */}
                      <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                        <div style={LABEL_STYLE}>Created</div>
                        <div style={{ ...VALUE_STYLE, fontSize: '0.8125rem', color: '#6b7280' }}>
                          {formatDate(discount.created_at)}
                        </div>
                      </div>

                      {/* Updated */}
                      <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                        <div style={LABEL_STYLE}>Updated</div>
                        <div style={{ ...VALUE_STYLE, fontSize: '0.8125rem', color: '#6b7280' }}>
                          {formatDate(discount.updated_at)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ flex: '0 0 auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleEdit(discount)}
                          style={{
                            padding: '0.375rem 0.875rem',
                            backgroundColor: '#0052a3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(discount)}
                          style={{
                            padding: '0.375rem 0.875rem',
                            backgroundColor: discount.is_active ? '#d97706' : '#059669',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {discount.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(discount.id)}
                          style={{
                            padding: '0.375rem 0.875rem',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
