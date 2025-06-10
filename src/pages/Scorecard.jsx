import React, { useState, useEffect } from 'react';
import scorecards from '../data/scorecards';
import { generateId } from '../utils/id';

const STORAGE_KEY = 'golf_trip_scores';

export default function Scorecard() {
  const courseKeys = Object.keys(scorecards);
  const [course, setCourse] = useState(courseKeys[0]);
  const [players, setPlayers] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_players`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [scores, setScores] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_scores`);
      const parsed = saved ? JSON.parse(saved) : {};
      courseKeys.forEach(c => {
        if (!parsed[c]) parsed[c] = {};
      });
      return parsed;
    } catch {
      return {};
    }
  });
  const [name, setName] = useState('');

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_players`, JSON.stringify(players));
    localStorage.setItem(`${STORAGE_KEY}_scores`, JSON.stringify(scores));
  }, [players, scores]);

  useEffect(() => {
    setScores(prev => {
      if (prev[course]) return prev;
      const updated = { ...prev, [course]: {} };
      players.forEach(p => {
        updated[course][p.id] = Array(18).fill('');
      });
      return updated;
    });
  }, [course, players]);

  const addPlayer = e => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setName('');
      return;
    }
    const id = generateId();
    setPlayers(prev => [...prev, { id, name: trimmed }]);
    setScores(prev => {
      const updated = { ...prev };
      courseKeys.forEach(c => {
        if (!updated[c]) updated[c] = {};
        updated[c][id] = Array(18).fill('');
      });
      return updated;
    });
    setName('');
  };

  const handleScoreChange = (pid, hole, value) => {
    setScores(prev => {
      const courseScores = prev[course] || {};
      const playerScores = courseScores[pid] || Array(18).fill('');
      const updated = [...playerScores];
      updated[hole] = value;
      return {
        ...prev,
        [course]: { ...courseScores, [pid]: updated }
      };
    });
  };

  const holeData = scorecards[course]?.holes || [];

  const calcTotal = (pid, start, end) => {
    const playerScores = scores[course]?.[pid] || [];
    let total = 0;
    for (let i = start; i < end; i++) {
      const v = parseInt(playerScores[i], 10);
      if (!isNaN(v)) total += v;
    }
    return total;
  };

  return (
    <section className="page" id="scorecard">
      <h2>Scorecard</h2>
      <div className="mt-8">
        <label className="form-label">Select Course</label>
        <select
          className="form-control"
          value={course}
          onChange={e => setCourse(e.target.value)}
        >
          {courseKeys.map(key => (
            <option key={key} value={key}>{scorecards[key].name}</option>
          ))}
        </select>
      </div>

      <form className="mt-8" onSubmit={addPlayer}>
        <div className="form-group">
          <label className="form-label">Add Player</label>
          <input
            className="form-control"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <button className="btn btn--primary">Add</button>
      </form>

      {players.length > 0 && (
        <div className="scorecard-table-container mt-8">
          <table className="scorecard-table">
            <thead>
              <tr>
                <th>Hole</th>
                {holeData.map((_, i) => (
                  <th key={i}>{i + 1}</th>
                ))}
                <th>Out</th>
                <th>In</th>
                <th>Total</th>
              </tr>
              <tr>
                <th>Par</th>
                {holeData.map((h, i) => (
                  <th key={i}>{h.par}</th>
                ))}
                <th>{holeData.slice(0,9).reduce((s,h)=>s+h.par,0)}</th>
                <th>{holeData.slice(9).reduce((s,h)=>s+h.par,0)}</th>
                <th>{holeData.reduce((s,h)=>s+h.par,0)}</th>
              </tr>
              <tr>
                <th>Hcp</th>
                {holeData.map((h, i) => (
                  <th key={i}>{h.hcp}</th>
                ))}
                <th></th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {players.map(player => {
                const out = calcTotal(player.id, 0, 9);
                const inn = calcTotal(player.id, 9, 18);
                const total = out + inn;
                return (
                  <tr key={player.id}>
                    <td>{player.name}</td>
                    {holeData.map((h, i) => {
                      const val = scores[course]?.[player.id]?.[i] || '';
                      let cls = 'score-par';
                      const num = parseInt(val,10);
                      if (!isNaN(num)) {
                        const diff = num - h.par;
                        if (diff <= -2) cls = 'score-eagle';
                        else if (diff === -1) cls = 'score-birdie';
                        else if (diff === 0) cls = 'score-par';
                        else if (diff === 1) cls = 'score-bogey';
                        else if (diff >= 2) cls = 'score-double';
                      }
                      return (
                        <td key={i} className={cls}>
                          <input
                            type="number"
                            className="form-control"
                            value={val}
                            onChange={e => handleScoreChange(player.id, i, e.target.value)}
                            style={{ width: '4rem' }}
                          />
                        </td>
                      );
                    })}
                    <td>{out || ''}</td>
                    <td>{inn || ''}</td>
                    <td>{total || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
