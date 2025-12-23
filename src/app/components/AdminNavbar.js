'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      localStorage.removeItem('admin_authenticated');
      localStorage.removeItem('admin_token');
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('admin_authenticated');
      localStorage.removeItem('admin_token');
      router.push('/admin/login');
    }
  };

  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      padding: '1rem 2rem',
      zIndex: 1000,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
      borderBottom: '1px solid #e1e4e8',
      height: '70px',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <Link href="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Image 
            src="/logo.png" 
            alt="CVERSE Logo" 
            width={120} 
            height={40}
          />
          <span style={{ 
            marginLeft: '0.75rem', 
            fontSize: '1.25rem', 
            fontWeight: '700',
            color: '#1a1a1a'
          }}>
            Admin Dashboard
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'center',
          marginLeft: 'auto'
        }}>
          <Link
            href="/admin"
            style={{
              textDecoration: 'none',
              color: isActive('/admin') ? '#0066cc' : '#1a1a1a',
              fontWeight: isActive('/admin') ? '600' : '400',
              fontSize: '1rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              backgroundColor: isActive('/admin') ? 'rgba(0, 102, 204, 0.1)' : 'transparent',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive('/admin')) {
                e.target.style.color = '#0066cc';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/admin')) {
                e.target.style.color = '#1a1a1a';
              }
            }}
          >
            Home
          </Link>
          <Link
            href="/admin/scholarships"
            style={{
              textDecoration: 'none',
              color: isActive('/admin/scholarships') ? '#0066cc' : '#1a1a1a',
              fontWeight: isActive('/admin/scholarships') ? '600' : '400',
              fontSize: '1rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              backgroundColor: isActive('/admin/scholarships') ? 'rgba(0, 102, 204, 0.1)' : 'transparent',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive('/admin/scholarships')) {
                e.target.style.color = '#0066cc';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/admin/scholarships')) {
                e.target.style.color = '#1a1a1a';
              }
            }}
          >
            Scholarships
          </Link>
          <Link
            href="/admin/config"
            style={{
              textDecoration: 'none',
              color: isActive('/admin/config') ? '#0066cc' : '#1a1a1a',
              fontWeight: isActive('/admin/config') ? '600' : '400',
              fontSize: '1rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              backgroundColor: isActive('/admin/config') ? 'rgba(0, 102, 204, 0.1)' : 'transparent',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive('/admin/config')) {
                e.target.style.color = '#0066cc';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/admin/config')) {
                e.target.style.color = '#1a1a1a';
              }
            }}
          >
            Config
          </Link>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              color: '#dc3545',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#c82333';
              e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#dc3545';
              e.target.style.backgroundColor = 'transparent';
            }}
            aria-label="Logout"
            title="Logout"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            display: 'none',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#1a1a1a',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem'
          }}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div style={{
          display: 'none',
          flexDirection: 'column',
          gap: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e1e4e8',
          marginTop: '1rem'
        }}>
          <Link
            href="/admin"
            onClick={() => setIsMenuOpen(false)}
            style={{
              textDecoration: 'none',
              color: isActive('/admin') ? '#0066cc' : '#1a1a1a',
              fontWeight: isActive('/admin') ? '600' : '400',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              backgroundColor: isActive('/admin') ? 'rgba(0, 102, 204, 0.1)' : 'transparent'
            }}
          >
            Home
          </Link>
          <Link
            href="/admin/scholarships"
            onClick={() => setIsMenuOpen(false)}
            style={{
              textDecoration: 'none',
              color: isActive('/admin/scholarships') ? '#0066cc' : '#1a1a1a',
              fontWeight: isActive('/admin/scholarships') ? '600' : '400',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              backgroundColor: isActive('/admin/scholarships') ? 'rgba(0, 102, 204, 0.1)' : 'transparent'
            }}
          >
            Scholarships
          </Link>
          <Link
            href="/admin/config"
            onClick={() => setIsMenuOpen(false)}
            style={{
              textDecoration: 'none',
              color: isActive('/admin/config') ? '#0066cc' : '#1a1a1a',
              fontWeight: isActive('/admin/config') ? '600' : '400',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              backgroundColor: isActive('/admin/config') ? 'rgba(0, 102, 204, 0.1)' : 'transparent'
            }}
          >
            Config
          </Link>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'transparent',
              color: '#dc3545',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            aria-label="Logout"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span style={{ color: '#dc3545' }}>Logout</span>
          </button>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          nav > div > div:first-of-type {
            display: none !important;
          }
          button[aria-label="Toggle menu"] {
            display: block !important;
          }
          div[style*="flexDirection: 'column'"] {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
}

