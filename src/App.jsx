import React, { useState, useEffect } from 'react';
import AuthProvider, { useAuth } from './components/AuthProvider';
import AuthModal from './components/AuthModal';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import Courses from './pages/Courses';
import Fines from './pages/Fines';
import Friday from './pages/Friday';
import Scorecard from './pages/Scorecard';
import Teams from './pages/Teams';
import Profile from './pages/Profile';

function AppContent() {
  const [page, setPage] = useState(() => window.location.hash.replace('#', '') || 'home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handler = () => setPage(window.location.hash.replace('#', '') || 'home');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    window.location.hash = page;
  }, [page]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (page) {
      case 'schedule':
        return <Schedule />;
      case 'courses':
        return <Courses />;
      case 'fines':
        return user ? <Fines /> : <AuthRequired />;
      case 'friday':
        return <Friday />;
      case 'scorecard':
        return user ? <Scorecard /> : <AuthRequired />;
      case 'teams':
        return user ? <Teams /> : <AuthRequired />;
      case 'profile':
        return user ? <Profile /> : <AuthRequired />;
      default:
        return <Home />;
    }
  };

  return (
    <>
      <Navigation 
        current={page} 
        onNavigate={setPage}
        onAuthClick={() => setShowAuthModal(true)}
      />
      <main className="container py-16">
        {renderContent()}
      </main>
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}

function AuthRequired() {
  return (
    <div className="card mt-8">
      <div className="card__body text-center">
        <h3 className="mb-4">Authentication Required</h3>
        <p className="text-gray-600">Please sign in to access this page.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}