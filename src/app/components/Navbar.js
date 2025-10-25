'use client';

import { useState, useEffect } from 'react';

export default function Navbar() {
  const [activeLink, setActiveLink] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <img src="/logo.png" alt="CVERSE Logo" className="logo" />
        <nav>
          <ul className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <li>
              <a 
                href="#home" 
                className={activeLink === 'home' ? 'active' : ''}
                onClick={(e) => handleNavClick(e, 'home')}
              >
                Home
              </a>
            </li>
            <li>
              <a 
                href="#about" 
                className={activeLink === 'about' ? 'active' : ''}
                onClick={(e) => handleNavClick(e, 'about')}
              >
                About
              </a>
            </li>
            <li>
              <a 
                href="#tracks" 
                className={activeLink === 'tracks' ? 'active' : ''}
                onClick={(e) => handleNavClick(e, 'tracks')}
              >
                Tracks
              </a>
            </li>
            <li>
              <a 
                href="#apply" 
                className={activeLink === 'apply' ? 'active' : ''}
                onClick={(e) => handleNavClick(e, 'apply')}
              >
                Apply
              </a>
            </li>
            <li>
              <a 
                href="#contact" 
                className={activeLink === 'contact' ? 'active' : ''}
                onClick={(e) => handleNavClick(e, 'contact')}
              >
                Contact
              </a>
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

