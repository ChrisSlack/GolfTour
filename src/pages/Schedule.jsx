import React from 'react';
import schedule from '../data/schedule';

export default function Schedule() {
  return (
    <section className="page active" id="schedule">
      <h2>Schedule</h2>
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
