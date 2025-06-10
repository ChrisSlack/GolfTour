import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { db } from '../lib/supabase';
import scorecards from '../data/scorecards';

export default function Scorecard() {
  const { user, userProfile } = useAuth();
  const [activeTour, setActiveTour] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadScores();
    }
  }, [selectedCourse, selectedPlayers]);

  const loadData = async () => {
    try {
      // Get active tour
      const { data: tour } = await db.getActiveTour();
      setActiveTour(tour);

      if (tour) {
        // Get courses for active tour
        const { data: coursesData } = await db.getCourses(tour.id);
        setCourses(coursesData || []);
        
        if (coursesData && coursesData.length > 0) {
          setSelectedCourse(coursesData[0]);
        }
      }

      // Get all users
      const { data: usersData } = await db.getUsers();
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading scorecard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScores = async () => {
    if (!selectedCourse || selectedPlayers.length === 0) {
      setScores({});
      return;
    }

    try {
      const { data: scoresData } = await db.getScores(selectedCourse.id);
      
      // Organize scores by user and hole
      const organizedScores = {};
      selectedPlayers.forEach(playerId => {
        organizedScores[playerId] = Array(18).fill('');
      });

      scoresData?.forEach(score => {
        if (organizedScores[score.user_id]) {
          organizedScores[score.user_id][score.hole_number - 1] = score.strokes.toString();
        }
      });

      setScores(organizedScores);
    } catch (error) {
      console.error('Error loading scores:', error);
    }
  };

  const handlePlayerToggle = (playerId) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  const handleScoreChange = (playerId, holeIndex, value) => {
    setScores(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [holeIndex]: value
      }
    }));
  };

  const handleSaveScorecard = async () => {
    if (!selectedCourse || !user) return;

    setSaving(true);
    try {
      // Save scores for each selected player
      for (const playerId of selectedPlayers) {
        const playerScores = scores[playerId] || Array(18).fill('');
        await db.saveScorecard(playerId, selectedCourse.id, playerScores, user.id);
      }
      
      alert('Scorecard saved successfully!');
      await loadScores(); // Reload to show saved data
    } catch (error) {
      console.error('Error saving scorecard:', error);
      alert('Error saving scorecard: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const calculateTotal = (playerId, startHole, endHole) => {
    const playerScores = scores[playerId] || {};
    let total = 0;
    for (let i = startHole; i < endHole; i++) {
      const score = parseInt(playerScores[i], 10);
      if (!isNaN(score)) {
        total += score;
      }
    }
    return total || '';
  };

  const getHoleData = () => {
    if (!selectedCourse) return [];
    
    // Try to match course with scorecard data
    const courseKey = Object.keys(scorecards).find(key => 
      scorecards[key].name.toLowerCase().includes(selectedCourse.name.toLowerCase()) ||
      selectedCourse.name.toLowerCase().includes(key.toLowerCase())
    );
    
    if (courseKey && scorecards[courseKey]) {
      return scorecards[courseKey].holes;
    }
    
    // Fallback to course holes from database or default
    return selectedCourse.holes || Array(18).fill({ par: 4, hcp: 1 });
  };

  if (loading) {
    return (
      <section className="page active">
        <div className="text-center">Loading scorecard...</div>
      </section>
    );
  }

  if (!activeTour) {
    return (
      <section className="page active">
        <h2>Scorecard</h2>
        <div className="card mt-8">
          <div className="card__body">
            <p>No active tour found. Please contact an administrator.</p>
          </div>
        </div>
      </section>
    );
  }

  const holeData = getHoleData();

  return (
    <section className="page active" id="scorecard">
      <h2>Scorecard - {activeTour.name} {activeTour.year}</h2>

      {/* Course Selection */}
      <div className="card mt-8">
        <div className="card__body">
          <div className="form-group">
            <label className="form-label">Select Course</label>
            <select
              className="form-control"
              value={selectedCourse?.id || ''}
              onChange={(e) => {
                const course = courses.find(c => c.id === e.target.value);
                setSelectedCourse(course);
              }}
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} {course.play_date ? `- ${new Date(course.play_date).toLocaleDateString()}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Player Selection */}
      <div className="card mt-8">
        <div className="card__body">
          <h3>Select Players</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {users.map(user => (
              <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPlayers.includes(user.id)}
                  onChange={() => handlePlayerToggle(user.id)}
                />
                <span className="text-sm">
                  {user.name} {user.surname} ({user.handicap})
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Scorecard */}
      {selectedCourse && selectedPlayers.length > 0 && (
        <div className="card mt-8">
          <div className="card__body">
            <div className="flex justify-between items-center mb-4">
              <h3>{selectedCourse.name}</h3>
              <button
                className="btn btn--primary"
                onClick={handleSaveScorecard}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Scorecard'}
              </button>
            </div>

            <div className="scorecard-table-container">
              <table className="scorecard-table">
                <thead>
                  <tr>
                    <th>Hole</th>
                    {Array.from({ length: 18 }, (_, i) => (
                      <th key={i}>{i + 1}</th>
                    ))}
                    <th>Out</th>
                    <th>In</th>
                    <th>Total</th>
                  </tr>
                  <tr>
                    <th>Par</th>
                    {holeData.map((hole, i) => (
                      <th key={i}>{hole.par}</th>
                    ))}
                    <th>{holeData.slice(0, 9).reduce((sum, hole) => sum + hole.par, 0)}</th>
                    <th>{holeData.slice(9).reduce((sum, hole) => sum + hole.par, 0)}</th>
                    <th>{holeData.reduce((sum, hole) => sum + hole.par, 0)}</th>
                  </tr>
                  <tr>
                    <th>HCP</th>
                    {holeData.map((hole, i) => (
                      <th key={i}>{hole.hcp}</th>
                    ))}
                    <th></th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlayers.map(playerId => {
                    const player = users.find(u => u.id === playerId);
                    const out = calculateTotal(playerId, 0, 9);
                    const inn = calculateTotal(playerId, 9, 18);
                    const total = out && inn ? out + inn : '';

                    return (
                      <tr key={playerId}>
                        <td className="font-medium">
                          {player?.name} {player?.surname}
                        </td>
                        {Array.from({ length: 18 }, (_, holeIndex) => {
                          const value = scores[playerId]?.[holeIndex] || '';
                          const par = holeData[holeIndex]?.par || 4;
                          const score = parseInt(value, 10);
                          
                          let className = 'score-par';
                          if (!isNaN(score)) {
                            const diff = score - par;
                            if (diff <= -2) className = 'score-eagle';
                            else if (diff === -1) className = 'score-birdie';
                            else if (diff === 0) className = 'score-par';
                            else if (diff === 1) className = 'score-bogey';
                            else if (diff >= 2) className = 'score-double';
                          }

                          return (
                            <td key={holeIndex} className={className}>
                              <input
                                type="number"
                                className="form-control"
                                value={value}
                                onChange={(e) => handleScoreChange(playerId, holeIndex, e.target.value)}
                                style={{ width: '4rem', textAlign: 'center' }}
                                min="1"
                                max="15"
                              />
                            </td>
                          );
                        })}
                        <td className="font-bold">{out}</td>
                        <td className="font-bold">{inn}</td>
                        <td className="font-bold">{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedCourse && selectedPlayers.length === 0 && (
        <div className="card mt-8">
          <div className="card__body text-center">
            <p>Please select players to start recording scores.</p>
          </div>
        </div>
      )}

      {!selectedCourse && (
        <div className="card mt-8">
          <div className="card__body text-center">
            <p>Please select a course to start recording scores.</p>
          </div>
        </div>
      )}
    </section>
  );
}