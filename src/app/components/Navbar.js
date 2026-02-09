'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const [activeLink, setActiveLink] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTracksDropdownOpen, setIsTracksDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let currentActive = 'home';

      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const offset = 200; // Adjust for header height + buffer

        if (rect.top <= offset && rect.bottom > offset) {
          currentActive = section.id;
        }
      });
      
      setActiveLink(currentActive);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 160; // Header height + padding
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setActiveLink(id);
      setIsMobileMenuOpen(false); // Close mobile menu after navigation
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header>
      <div className="container header-container">
        <Image src="/logo.png" alt="CVERSE Logo" className="logo" width={150} height={50} style={{ width: 'auto', height: 'auto' }} priority />
        <nav>
          <ul className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <li>
              <Link 
                href="/" 
                className={activeLink === 'home' ? 'active' : ''}
                onClick={(e) => {
                  if (window.location.pathname === '/') {
                    handleNavClick(e, 'home');
                  }
                }}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                href="/#about" 
                className={activeLink === 'about' ? 'active' : ''}
                onClick={(e) => {
                  if (window.location.pathname === '/') {
                    handleNavClick(e, 'about');
                  }
                }}
              >
                About
              </Link>
            </li>
            <li 
              className="nav-item-dropdown"
              onMouseEnter={() => !isMobileMenuOpen && setIsTracksDropdownOpen(true)}
              onMouseLeave={() => !isMobileMenuOpen && setIsTracksDropdownOpen(false)}
            >
              <a 
                href="#tracks" 
                className={activeLink === 'tracks' ? 'active' : ''}
                onClick={(e) => {
                  // Toggle dropdown on mobile
                  if (isMobileMenuOpen) {
                    e.preventDefault();
                    setIsTracksDropdownOpen(!isTracksDropdownOpen);
                  } else if (window.location.pathname === '/') {
                    handleNavClick(e, 'tracks');
                  }
                }}
              >
                Tracks
                <span className="dropdown-arrow">▼</span>
              </a>
              {isTracksDropdownOpen && (
                <ul className="dropdown-menu">
                  <li>
                    <Link href="/datascience" onClick={() => setIsMobileMenuOpen(false)}>
                      Data Science
                    </Link>
                  </li>
                  <li>
                    <Link href="/projectmanagement" onClick={() => setIsMobileMenuOpen(false)}>
                      Project Management
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <Link 
                href="/#contact" 
                className={activeLink === 'contact' ? 'active' : ''}
                onClick={(e) => {
                  if (window.location.pathname === '/') {
                    handleNavClick(e, 'contact');
                  }
                }}
              >
                Contact
              </Link>
            </li>
          </ul>
          <button 
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </nav>
      </div>
    </header>
  );
}

