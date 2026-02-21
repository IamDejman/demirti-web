'use client';

export default function AdminManagementSection({
  admins,
  saving,
  showAdminForm,
  setShowAdminForm,
  editingAdmin,
  setEditingAdmin,
  showPassword,
  setShowPassword,
  adminFormData,
  setAdminFormData,
  handleAdminInputChange,
  handleCreateAdmin,
  handleUpdateAdmin,
  handleToggleAdminStatus,
  formatDate,
}) {
  return (
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
  );
}
