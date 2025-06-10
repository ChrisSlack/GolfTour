import React from 'react';
import schedule from '../data/schedule';

export default function Schedule() {
  return (
    <section className="page" id="schedule">
      <h2>Schedule</h2>
      <div className="card mt-8">
        <div className="card__body schedule-table-container">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course/Activity</th>
                <th>Tee Time</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(day => (
                <tr key={day.date}>
                  <td>{day.date}</td>
                  <td>{day.course}</td>
                  <td>{day.teeTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
