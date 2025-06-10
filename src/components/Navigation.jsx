import React from 'react';

export default function Navigation({ current, onNavigate }) {
  const links = [
    { id: 'home', label: 'Home' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'courses', label: 'Golf Courses' },
    { id: 'fines', label: 'Banter & Fines' },
    { id: 'friday', label: 'Friday Activities' }
  ];

  return (
    <header className="site-header">
      <div className="container">
        <div className="flex items-center justify-between">
          <div className="logo">
            <h1><i className="fas fa-golf-ball"></i> Portugal Golf Trip 2025</h1>
          </div>
          <nav className="main-nav">
            <ul className="flex gap-8">
              {links.map(link => (
                <li key={link.id}>
                  <a
                    href="#"
                    onClick={e => { e.preventDefault(); onNavigate(link.id); }}
                    className={`nav-link${current === link.id ? ' active' : ''}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
