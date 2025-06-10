import React, { useState } from 'react';
import courses from '../data/courses';

export default function Courses() {
  const [selected, setSelected] = useState(null);

  if (selected) {
    const course = courses[selected];
    return (
      <section className="page" id="courses">
        <button className="btn mb-8" onClick={() => setSelected(null)}>Back</button>
        <h2>{course.name}</h2>
        <p className="mt-8">{course.description}</p>
        <h3 className="mt-8">Tips</h3>
        <ul className="mt-4">
          {course.tips.map(tip => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <p className="mt-8">
          <a href={course.website} target="_blank" rel="noopener noreferrer">Visit website</a>
        </p>
      </section>
    );
  }

  return (
    <section className="page" id="courses">
      <h2>Golf Courses</h2>
      <div className="courses-grid mt-8">
        {Object.entries(courses).map(([key, course]) => (
          <div key={key} className="card course-card">
            <div className="card__body">
              <h3 className="course-title">{course.name}</h3>
              <p>{course.description.substring(0, 150)}...</p>
              <button className="btn btn--primary btn--full-width view-course mt-8" onClick={() => setSelected(key)}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
