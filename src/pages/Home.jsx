import React from 'react';
import Countdown from '../components/Countdown';

export default function Home() {
  return (
    <section className="page active" id="home">
      <div className="hero card">
        <div className="card__body">
          <h2>Welcome to our Portugal Golf Trip 2025!</h2>
          <p>Get ready for an unforgettable golfing adventure in the beautiful Algarve region of Portugal.</p>
        </div>
      </div>
      <Countdown />
    </section>
  );
}
