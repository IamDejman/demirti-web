'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const navLinkStyle = (active) => ({
  textDecoration: 'none',
  color: active ? '#0066cc' : '#1a1a1a',
  fontWeight: active ? '600' : '400',
  fontSize: '1rem',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  backgroundColor: active ? 'rgba(0, 102, 204, 0.1)' : 'transparent',
  transition: 'all 0.3s ease',
});

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

  const isActive = (path) => pathname === path;

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <nav className="admin-nav">
        <div className="admin-nav-inner">
          <Link href="/admin" className="admin-nav-logo" onClick={closeMenu}>
            <Image src="/logo.png" alt="CVERSE Logo" width={120} height={40} className="admin-nav-logo-img" />
            <span className="admin-nav-title admin-nav-title-full">Admin Dashboard</span>
            <span className="admin-nav-title admin-nav-title-short" aria-hidden="true">Admin</span>
          </Link>

          <div className="admin-nav-desktop">
            <Link href="/admin" style={navLinkStyle(isActive('/admin'))}>Home</Link>
            <Link href="/admin/scholarships" style={navLinkStyle(isActive('/admin/scholarships'))}>Scholarships</Link>
            <Link href="/admin/discounts" style={navLinkStyle(isActive('/admin/discounts'))}>Discounts</Link>
            <Link href="/admin/analytics" style={navLinkStyle(isActive('/admin/analytics'))}>Analytics</Link>
            <Link href="/admin/goals" style={navLinkStyle(isActive('/admin/goals'))}>Goals</Link>
            <Link href="/admin/funnels" style={navLinkStyle(isActive('/admin/funnels'))}>Funnels</Link>
            <Link href="/admin/config" style={navLinkStyle(isActive('/admin/config'))}>Config</Link>
            <button
              type="button"
              onClick={handleLogout}
              className="admin-nav-logout-btn"
              aria-label="Logout"
              title="Logout"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            className="admin-nav-hamburger"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        <div className={`admin-nav-mobile ${isMenuOpen ? 'open' : ''}`}>
          <Link href="/admin" onClick={closeMenu} style={navLinkStyle(isActive('/admin'))}>Home</Link>
          <Link href="/admin/scholarships" onClick={closeMenu} style={navLinkStyle(isActive('/admin/scholarships'))}>Scholarships</Link>
          <Link href="/admin/discounts" onClick={closeMenu} style={navLinkStyle(isActive('/admin/discounts'))}>Discounts</Link>
          <Link href="/admin/analytics" onClick={closeMenu} style={navLinkStyle(isActive('/admin/analytics'))}>Analytics</Link>
          <Link href="/admin/goals" onClick={closeMenu} style={navLinkStyle(isActive('/admin/goals'))}>Goals</Link>
          <Link href="/admin/funnels" onClick={closeMenu} style={navLinkStyle(isActive('/admin/funnels'))}>Funnels</Link>
          <Link href="/admin/config" onClick={closeMenu} style={navLinkStyle(isActive('/admin/config'))}>Config</Link>
          <button type="button" onClick={handleLogout} className="admin-nav-mobile-logout" aria-label="Logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <style jsx>{`
        .admin-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background-color: #ffffff;
          color: #1a1a1a;
          padding: 1rem 2rem;
          z-index: 1000;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
          border-bottom: 1px solid #e1e4e8;
          min-height: 70px;
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }
        .admin-nav-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          width: 100%;
          justify-content: space-between;
          min-width: 0;
        }
        .admin-nav-logo {
          text-decoration: none;
          display: flex;
          align-items: center;
          flex-shrink: 1;
          min-width: 0;
        }
        .admin-nav-logo-img {
          width: 120px;
          height: auto;
          flex-shrink: 0;
        }
        .admin-nav-title {
          margin-left: 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1a1a;
          white-space: nowrap;
        }
        .admin-nav-title-short {
          display: none;
        }
        .admin-nav-desktop {
          display: flex;
          gap: 2rem;
          align-items: center;
          margin-left: auto;
        }
        .admin-nav-logout-btn {
          padding: 0.5rem;
          background: transparent;
          color: #dc3545;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
        }
        .admin-nav-logout-btn:hover {
          color: #c82333;
          background: rgba(220, 53, 69, 0.1);
        }
        .admin-nav-hamburger {
          display: none;
          background: transparent;
          border: none;
          color: #1a1a1a;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem 0.75rem;
          line-height: 1;
          margin-left: auto;
        }
        .admin-nav-mobile {
          display: none;
          flex-direction: column;
          gap: 0;
          padding: 1rem 0 0;
          border-top: 1px solid #e1e4e8;
          margin-top: 0.5rem;
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
          box-sizing: border-box;
        }
        .admin-nav-mobile a {
          min-height: 44px;
          display: flex;
          align-items: center;
          padding: 0.75rem 0;
          box-sizing: border-box;
        }
        @media (min-width: 769px) {
          .admin-nav-mobile,
          .admin-nav-mobile.open {
            display: none !important;
          }
        }
        .admin-nav-mobile.open {
          display: flex;
        }
        .admin-nav-mobile-logout {
          padding: 0.75rem 1rem;
          background: transparent;
          color: #dc3545;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .admin-nav-mobile-logout:hover {
          background: rgba(220, 53, 69, 0.08);
        }
        .admin-nav-mobile-logout {
          min-height: 44px;
        }

        @media (max-width: 768px) {
          .admin-nav {
            padding: 0.75rem 1rem;
            min-height: 56px;
          }
          .admin-nav-logo-img {
            width: 90px;
          }
          .admin-nav-title-full {
            font-size: 1rem;
            margin-left: 0.5rem;
          }
          .admin-nav-title-short {
            display: none;
          }
          .admin-nav-desktop {
            display: none !important;
          }
          .admin-nav-hamburger {
            display: block !important;
          }
          .admin-nav-mobile.open {
            display: flex;
          }
        }

        @media (max-width: 480px) {
          .admin-nav-title-full {
            display: none;
          }
          .admin-nav-title-short {
            display: inline;
            margin-left: 0.5rem;
            font-size: 1rem;
            font-weight: 700;
            color: #1a1a1a;
          }
          .admin-nav-logo-img {
            width: 72px;
          }
        }
      `}</style>
    </>
  );
}
