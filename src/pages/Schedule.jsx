import React from 'react';
import schedule from '../data/schedule';

export default function Schedule() {
  return (
    <section className="page active" id="schedule">
      <h2>Schedule</h2>
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
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Golf Course</th>
                <th>Departure Time</th>
                <th>Travel Time (mins)</th>
                <th>Pre-Tee Off Time (hrs)</th>
                <th>Tee Time</th>
                <th>Golf &amp; Drinks (hrs)</th>
                <th>Pick Up Time</th>
                <th>Link to Golf Course</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(day => (
                <tr key={day.date}>
                  <td>{day.date}</td>
                  <td>{day.course}</td>
                  <td>{day.departureTime}</td>
                  <td>{day.travelTime}</td>
                  <td>{day.preTeeOffTime}</td>
                  <td>{day.teeTime}</td>
                  <td>{day.golfDrinksHours}</td>
                  <td>{day.pickUpTime}</td>
                  <td>
                    {day.link !== 'N/A' ? (
                      <a href={day.link} target="_blank" rel="noopener noreferrer">
                        {day.course}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
