import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

export default function Navigation({ current, onNavigate, onAuthClick }) {
  const { user, userProfile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <header className="site-header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1><i className="fas fa-golf-ball"></i> Portugal Golf Trip 2025</h1>
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>

          {/* Desktop navigation */}
          <nav className="main-nav desktop-nav">
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
                      Welcome, {userProfile?.name || user.email}
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
        {isMobileMenuOpen && (
          <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* Mobile navigation menu */}
        <nav className={`main-nav mobile-nav ${isMobileMenuOpen ? 'mobile-nav--open' : ''}`}>
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
                    Welcome, {userProfile?.name || user.email}
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
    </header>
  );
}