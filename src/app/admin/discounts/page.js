'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '../../components/AdminNavbar';
import { useToast } from '../../components/ToastProvider';

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

  // Check authentication on mount
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
    } catch (error) {
      console.error('Error loading discounts:', error);
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
    } catch (error) {
      console.error('Error creating discount:', error);
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
    } catch (error) {
      console.error('Error updating discount:', error);
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
    } catch (error) {
      console.error('Error deleting discount:', error);
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
    } catch (error) {
      console.error('Error updating discount status:', error);
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

  return (
    <main className="admin-with-fixed-nav">
      <AdminNavbar />
      <div className="admin-dashboard admin-content-area">
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div className="admin-page-header" style={{ justifyContent: 'space-between' }}>
            <h1 className="admin-page-title">Discounts</h1>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingDiscount(null);
                setFormData({ name: '', percentage: '' });
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
              {showForm ? 'Cancel' : '+ Create Discount'}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <p style={{ fontSize: '1.25rem', color: '#666' }}>Loading...</p>
            </div>
          ) : (
            <>
              {/* Create/Edit Form */}
              {showForm && (
                <div style={{
                  backgroundColor: 'white',
                  padding: '2rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  marginBottom: '2rem',
                  border: '2px solid #00c896'
                }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
                    {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
                  </h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        Discount Name <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., Early Bird, Summer Sale"
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
                        Discount Percentage <span style={{ color: 'red' }}>*</span>
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
                            padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                            border: '2px solid #e1e4e8',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            boxSizing: 'border-box'
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
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>
                        Enter a value between 0 and 100
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingDiscount(null);
                        setFormData({ name: '', percentage: '' });
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
                      onClick={editingDiscount ? handleUpdate : handleCreate}
                      disabled={saving}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: saving ? '#999' : '#00c896',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        cursor: saving ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {saving ? 'Saving...' : (editingDiscount ? 'Update Discount' : 'Create Discount')}
                    </button>
                  </div>
                </div>
              )}

              {/* Discounts List */}
              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1a1a1a' }}>
                  All Discounts ({discounts.length})
                </h2>
                
                {discounts.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    No discounts found. Create your first discount.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e1e4e8', backgroundColor: '#f8f9fa' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Name</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Percentage</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Status</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Created</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Updated</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {discounts.map((discount) => (
                          <tr key={discount.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '0.75rem', color: '#1a1a1a', fontWeight: '600' }}>
                              {discount.name}
                            </td>
                            <td style={{ padding: '0.75rem', color: '#1a1a1a', fontWeight: '600' }}>
                              {parseFloat(discount.percentage).toFixed(2)}%
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                backgroundColor: discount.is_active ? '#d4edda' : '#f8d7da',
                                color: discount.is_active ? '#155724' : '#721c24'
                              }}>
                                {discount.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                              {formatDate(discount.created_at)}
                            </td>
                            <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                              {formatDate(discount.updated_at)}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => handleEdit(discount)}
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
                                  onClick={() => handleToggleStatus(discount)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: discount.is_active ? '#ffc107' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                  }}
                                >
                                  {discount.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDelete(discount.id)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                  }}
                                >
                                  Delete
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
            </>
          )}
        </div>
      </div>
    </main>
  );
}

