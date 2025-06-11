import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

export default function Navigation({ current, onNavigate, onAuthClick }) {
  const { user, userProfile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Enhanced mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Consider it mobile if any of these conditions are true
      const mobile = isMobileDevice || (isSmallScreen && isTouchDevice) || isSmallScreen;
      setIsMobile(mobile);
      
      // Force mobile layout on mobile devices
      if (mobile) {
        document.body.classList.add('mobile-device');
      } else {
        document.body.classList.remove('mobile-device');
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  const links = [
    { id: 'home', label: 'Home' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'courses', label: 'Golf Courses' },
    { id: 'fines', label: 'Banter & Fines' },
    { id: 'friday', label: 'Friday Activities' },
    { id: 'scorecard', label: 'Scorecard' },
    { id: 'teams', label: 'Teams' },
    { id: 'profile', label: 'Profile' }
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNavClick = (linkId) => {
    onNavigate && onNavigate(linkId);
    setIsMobileMenuOpen(false); // Close mobile menu when navigating
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={`site-header ${isMobile ? 'mobile-header' : ''}`}>
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1>
              <i className="fas fa-golf-ball"></i> 
              {isMobile ? 'Golf Trip 2025' : 'Portugal Golf Trip 2025'}
            </h1>
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            style={{ display: isMobile ? 'block' : 'none' }}
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>

          {/* Desktop navigation */}
          <nav className={`main-nav ${isMobile ? 'mobile-nav' : 'desktop-nav'} ${isMobile && isMobileMenuOpen ? 'mobile-nav--open' : ''}`}>
            <ul className="nav-list">
              {links.map(link => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={() => handleNavClick(link.id)}
                    className={`nav-link${current === link.id ? ' active' : ''}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="auth-section">
                {user ? (
                  <div className="user-menu">
                    <span className="user-greeting">
                      {isMobile ? userProfile?.name || 'User' : `Welcome, ${userProfile?.name || user.email}`}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="btn btn--secondary btn--sm"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onAuthClick}
                    className="btn btn--primary btn--sm"
                  >
                    Sign In
                  </button>
                )}
              </li>
            </ul>
          </nav>
        </div>

        {/* Mobile navigation overlay */}
        {isMobile && isMobileMenuOpen && (
          <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)} />
        )}
      </div>
    </header>
  );
}