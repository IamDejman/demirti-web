'use client';

export default function TrackConfigSection({ tracks, saving, handleInputChange, handleSave, formatCurrency }) {
  return (
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
  );
}
