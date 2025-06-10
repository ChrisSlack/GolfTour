import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import Courses from './pages/Courses';
import Fines from './pages/Fines';
import Friday from './pages/Friday';
import Scorecard from './pages/Scorecard';

export default function App() {
  const [page, setPage] = useState('home');

  let content;
  switch (page) {
    case 'schedule':
      content = <Schedule />;
      break;
    case 'courses':
      content = <Courses />;
      break;
    case 'fines':
      content = <Fines />;
      break;
    case 'friday':
      content = <Friday />;
      break;
    case 'scorecard':
      content = <Scorecard />;
      break;
    default:
      content = <Home />;
  }

  return (
    <>
      <Navigation current={page} onNavigate={setPage} />
      <main className="container py-16">
        {content}
      </main>
    </>
  );
}
