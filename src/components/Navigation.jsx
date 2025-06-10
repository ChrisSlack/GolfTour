import React from 'react';
import { useAuth } from './AuthProvider';

export default function Navigation({ current, onNavigate, onAuthClick }) {
  const { user, userProfile, signOut } = useAuth();

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

  return (
    <header className="site-header">
      <div className="container">
        <div className="flex items-center justify-between">
          <div className="logo">
            <h1><i className="fas fa-golf-ball"></i> Portugal Golf Trip 2025</h1>
          </div>
          <nav className="main-nav">
            <ul className="flex gap-8 items-center">
              {links.map(link => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={() => onNavigate && onNavigate(link.id)}
                    className={`nav-link${current === link.id ? ' active' : ''}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                {user ? (
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
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
      </div>
    </header>
  );
}