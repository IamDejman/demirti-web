'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    // Check if already logged in
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (isAuthenticated) {
      router.push('/admin');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = { error: 'Invalid response from server' };
      }

      if (response.ok && data.success) {
        // Store authentication token
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_token', data.token || 'authenticated');
        
        showToast({
          type: 'success',
          message: 'Login successful! Redirecting...'
        });

        // Redirect to admin dashboard
        setTimeout(() => {
          router.push('/admin');
        }, 500);
      } else {
        // Show server error message (401 = invalid credentials, etc.)
        const errorMessage = data.details 
          ? `${data.error}\n\n${data.details}` 
          : (data.error || (response.status === 401 ? 'Invalid email or password.' : 'Login failed. Please try again.'));
        
        showToast({
          type: 'error',
          message: errorMessage
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast({
        type: 'error',
        message: 'An error occurred during login. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <div className="admin-auth-page">
        <div className="admin-auth-card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '0.5rem'
            }}>
              Admin Login
            </h1>
            <p style={{
              color: '#666',
              fontSize: '0.95rem'
            }}>
              Enter your credentials to access the admin dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="email" style={{
                display: 'block',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '0.5rem',
                fontSize: '0.9rem'
              }}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  border: '2px solid #e1e4e8',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
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

            <div style={{ marginBottom: '2rem' }}>
              <label htmlFor="password" style={{
                display: 'block',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '0.5rem',
                fontSize: '0.9rem'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '0.875rem 4.5rem 0.875rem 0.875rem',
                    border: '2px solid #e1e4e8',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0066cc';
                    e.target.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e1e4e8';
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPassword(!showPassword);
                  }}
                  disabled={isSubmitting}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
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
                    pointerEvents: isSubmitting ? 'none' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.target.style.color = '#0066cc';
                      e.target.style.backgroundColor = '#f0f0f0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.target.style.color = '#666';
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    if (!isSubmitting) {
                      e.target.style.color = '#0066cc';
                      e.target.style.backgroundColor = '#f0f0f0';
                    }
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    if (!isSubmitting) {
                      setShowPassword(!showPassword);
                      e.target.style.color = '#666';
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <p style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
              <a
                href="/admin/forgot-password"
                style={{ color: '#0066cc', textDecoration: 'none', fontSize: '0.9rem' }}
              >
                Forgot password?
              </a>
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: isSubmitting ? '#999' : '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.target.style.backgroundColor = '#004d99';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.target.style.backgroundColor = '#0066cc';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#888' }}>
              No admin yet? Create one: <code style={{ background: '#f0f0f0', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>POST /api/admin/admins</code> with body <code style={{ background: '#f0f0f0', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{'{"email":"you@example.com","password":"yourpassword"}'}</code> — see DATABASE_SETUP.md.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

