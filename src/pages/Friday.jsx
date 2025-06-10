import React, { useState, useEffect } from 'react';
import fridayActivities from '../data/fridayActivities';

const STORAGE_KEY = 'golf_trip_activities';

export default function Friday() {
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : fridayActivities;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }, [activities]);

  const vote = (categoryName, activityName) => {
    const updated = activities.map(cat => {
      if (cat.category === categoryName) {
        return {
          ...cat,
          activities: cat.activities.map(act =>
            act.name === activityName ? { ...act, votes: act.votes + 1 } : act
          )
        };
      }
      return cat;
    });
    setActivities(updated);
  };

  return (
    <section className="page" id="friday">
      <h2>Friday Activities</h2>
      {activities.map(cat => (
        <div key={cat.category} className="mt-8">
          <h3>{cat.category}</h3>
          {cat.activities.map(act => (
            <div key={act.name} className="card mt-4 activity-card">
              <div className="card__body">
                <div className="activity-title">
                  <h4>{act.name}</h4>
                  <span className="vote-count">{act.votes} votes</span>
                </div>
                <p className="mt-4">{act.description}</p>
                <button className="btn btn--secondary vote-btn mt-4" onClick={() => vote(cat.category, act.name)}>
                  <i className="fas fa-thumbs-up"></i> Vote
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
