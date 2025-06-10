import React, { useState, useEffect } from 'react';
import fridayActivities from '../data/fridayActivities';

const STORAGE_KEY = 'golf_trip_activities';

export default function Friday() {
  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      // Merge saved votes with the latest activity list so new
      // categories or activities appear for returning users
      return fridayActivities.map(cat => {
        const savedCat = parsed.find(c => c.category === cat.category);
        return {
          category: cat.category,
          activities: cat.activities.map(act => {
            const savedAct = savedCat?.activities.find(a => a.name === act.name);
            return savedAct ? { ...act, votes: savedAct.votes } : act;
          })
        };
      });
    } catch (err) {
      console.error('Failed to parse activities from storage', err);
      return fridayActivities;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }, [activities]);

  const vote = (categoryName, activityName) => {
    setActivities(prev =>
      prev.map(cat => {
        if (cat.category === categoryName) {
          return {
            ...cat,
            activities: cat.activities.map(act =>
              act.name === activityName ? { ...act, votes: act.votes + 1 } : act
            )
          };
        }
        return cat;
      })
    );
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
