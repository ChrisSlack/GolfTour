import React from 'react';
import Countdown from '../components/Countdown';
import Leaderboard from '../components/Leaderboard';
import { useAuth } from '../components/AuthProvider';

export default function Home() {
  const { user } = useAuth();

  const handleScorecardClick = () => {
    window.location.hash = 'scorecard';
  };

  return (
    <section className="page active" id="home">
      <div className="hero card">
        <div className="card__body">
          <h2>Welcome to our Portugal Golf Trip 2025!</h2>
          <p>Get ready for an unforgettable golfing adventure in the beautiful Algarve region of Portugal.</p>
          
          {/* Quick Link to Scorecard */}
          {user && (
            <div className="mt-8">
              <button
                onClick={handleScorecardClick}
                className="btn btn--primary btn--lg"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-8)',
                  margin: '0 auto'
                }}
              >
                <i className="fas fa-golf-ball"></i>
                <span>Start Scoring Round</span>
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>
      <Countdown />
      
      {/* Leaderboard Dashboard */}
      <div className="mt-8">
        <Leaderboard />
      </div>
      
      <div className="card mt-8">
        <div className="card__body">
          <h3>Hotel</h3>
          <p>
            <a
              href="https://www.google.com/maps/place/Hotel+Vila+Gal%C3%A9+Cerro+Alagoa/@37.0902751,-8.2464811,1820m/data=!3m2!1e3!4b1!4m9!3m8!1s0xd1acc1ed02352b3:0x9b33e2804786b813!5m2!4m1!1i2!8m2!3d37.0902751!4d-8.2439008!16s%2Fg%2F1wb8vz6s?entry=ttu&g_ep=EgoyMDI1MDYwNC4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Hotel Vila Galé Cerro Alagoa on Google Maps
            </a>
          </p>
        </div>
      </div>
      <div className="card mt-8">
        <div className="card__body schedule-table-container">
          <h3>Course Metrics</h3>
          <table className="summary-table mt-4">
            <thead>
              <tr>
                <th>Metric</th>
                <th><a href="#courses">NAU Morgado</a></th>
                <th><a href="#courses">Amendoeira Faldo</a></th>
                <th><a href="#courses">Quinta do Lago South</a></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Length (White/Black Tees)</td>
                <td>6,399m</td>
                <td>6,598m</td>
                <td>6,488m</td>
              </tr>
              <tr>
                <td>Longest Hole</td>
                <td>535m (Par 5, Hole 3)</td>
                <td>613m (Par 5, Hole 13)</td>
                <td>510m (Par 5, Hole 17)</td>
              </tr>
              <tr>
                <td>Shortest Hole</td>
                <td>166m (Par 3, Hole 11)</td>
                <td>138m (Par 3, Hole 16)</td>
                <td>171m (Par 3, Hole 4)</td>
              </tr>
              <tr>
                <td>Average Green Size</td>
                <td>600m²</td>
                <td>550m²</td>
                <td>650m²</td>
              </tr>
              <tr>
                <td>Course Rating (Black)</td>
                <td>72.7</td>
                <td>74.5</td>
                <td>73.7</td>
              </tr>
              <tr>
                <td>Slope Rating (Black)</td>
                <td>129</td>
                <td>142</td>
                <td>139</td>
              </tr>
              <tr>
                <td>Total Bunkers</td>
                <td>85+ (Scottish-style)</td>
                <td>70+ (Desert scrub)</td>
                <td>60+ (Strategic placement)</td>
              </tr>
              <tr>
                <td>Water Hazards</td>
                <td>4 lakes</td>
                <td>5 watercourses</td>
                <td>3 lakes (incl. Hole 15)</td>
              </tr>
              <tr>
                <td>Signature Hole</td>
                <td>18th (Par 4, elevated tee)</td>
                <td>18th (Par 5, narrow fairway)</td>
                <td>15th (Par 3 over lake)</td>
              </tr>
              <tr>
                <td>Year Opened</td>
                <td>2003</td>
                <td>2008</td>
                <td>1974</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}