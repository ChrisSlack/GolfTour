import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { db } from '../lib/supabase';
import scorecards from '../data/scorecards';
import courseRatings from '../data/courseRatings';

export default function Scorecard() {
  const { user, userProfile } = useAuth();
  const [activeTour, setActiveTour] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [scores, setScores] = useState({});
  const [scoreExtras, setScoreExtras] = useState({}); // For 3-putts and rings
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showNet, setShowNet] = useState(false);
  const [scoringMode, setScoringMode] = useState('stroke'); // 'stroke' or 'stableford'

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadScores();
    }
  }, [selectedCourse, selectedPlayers]);

  // Calculate course handicap using USGA formula
  const calculateCourseHandicap = (handicapIndex, courseKey) => {
    const courseData = courseRatings[courseKey];
    if (!courseData) {
      // Fallback to simplified calculation if course data not found
      return Math.round(handicapIndex);
    }

    // USGA Formula: Course Handicap = Handicap Index × (Slope Rating ÷ 113)
    const courseHandicap = handicapIndex * (courseData.slopeRating / 113);
    return Math.round(courseHandicap);
  };

  // Calculate net score using USGA method (simple subtraction)
  const calculateNetScore = (grossScore, courseHandicap) => {
    // Under USGA rules: Net Score = Gross Score - Course Handicap
    // Minimum net score is 1 (can't go below 1)
    return Math.max(1, grossScore - courseHandicap);
  };

  // Calculate Stableford points based on net score vs par
  const calculateStablefordPoints = (netScore, par) => {
    const diff = netScore - par;
    if (diff <= -3) return 5; // Albatross/Double Eagle
    if (diff === -2) return 4; // Eagle
    if (diff === -1) return 3; // Birdie
    if (diff === 0) return 2;  // Par
    if (diff === 1) return 1;  // Bogey
    return 0; // Double bogey or worse
  };

  // Allocate handicap strokes to holes based on stroke index
  const allocateHandicapStrokes = (courseHandicap, holeData) => {
    const strokesPerHole = Array(18).fill(0);
    
    if (courseHandicap <= 0) return strokesPerHole;
    
    // Sort holes by stroke index to allocate strokes
    const holesWithIndex = holeData.map((hole, index) => ({
      holeNumber: index,
      strokeIndex: hole.hcp || (index + 1)
    })).sort((a, b) => a.strokeIndex - b.strokeIndex);
    
    // Allocate strokes
    let remainingStrokes = courseHandicap;
    
    // First round: give one stroke to holes based on stroke index
    for (let i = 0; i < Math.min(18, remainingStrokes); i++) {
      strokesPerHole[holesWithIndex[i].holeNumber] = 1;
    }
    remainingStrokes -= Math.min(18, remainingStrokes);
    
    // Second round: give second stroke if handicap > 18
    for (let i = 0; i < Math.min(18, remainingStrokes); i++) {
      strokesPerHole[holesWithIndex[i].holeNumber] = 2;
    }
    
    return strokesPerHole;
  };

  // Get course key from course name
  const getCourseKey = (courseName) => {
    const name = courseName.toLowerCase();
    if (name.includes('morgado')) return 'morgado';
    if (name.includes('amendoeira') || name.includes('faldo')) return 'amendoeira';
    if (name.includes('quinta') || name.includes('lago')) return 'quintadolago';
    return null;
  };

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
      setScoreExtras({});
      return;
    }

    try {
      const { data: scoresData } = await db.getScores(selectedCourse.id);
      
      // Organize scores by user and hole
      const organizedScores = {};
      const organizedExtras = {};
      
      selectedPlayers.forEach(playerId => {
        organizedScores[playerId] = Array(18).fill('');
        organizedExtras[playerId] = {};
      });

      scoresData?.forEach(score => {
        if (organizedScores[score.user_id]) {
          organizedScores[score.user_id][score.hole_number - 1] = score.strokes.toString();
          
          // Load extras (3-putts and rings)
          if (!organizedExtras[score.user_id]) {
            organizedExtras[score.user_id] = {};
          }
          organizedExtras[score.user_id][score.hole_number] = {
            threePutt: score.three_putt || false,
            ring: score.ring || false
          };
        }
      });

      setScores(organizedScores);
      setScoreExtras(organizedExtras);
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
    // Validate score: must be between 1 and 12
    const numValue = parseInt(value, 10);
    if (value !== '' && (isNaN(numValue) || numValue < 1 || numValue > 12)) {
      return; // Don't update if invalid
    }

    setScores(prev => {
      // Get the current scores array for this player, or create a new one
      const currentPlayerScores = prev[playerId] || Array(18).fill('');
      
      // Create a new array with the updated score
      const newPlayerScores = [...currentPlayerScores];
      newPlayerScores[holeIndex] = value;
      
      return {
        ...prev,
        [playerId]: newPlayerScores
      };
    });
  };

  const handleExtraChange = (playerId, holeNumber, extraType, value) => {
    setScoreExtras(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [holeNumber]: {
          ...prev[playerId]?.[holeNumber],
          [extraType]: value
        }
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
        const playerExtras = scoreExtras[playerId] || {};
        await db.saveScorecard(playerId, selectedCourse.id, playerScores, user.id, playerExtras);
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

  const handleDeleteScorecard = async () => {
    if (!selectedCourse || selectedPlayers.length === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete scorecards for ${selectedPlayers.length} player(s) on ${selectedCourse.name}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeleting(true);
    try {
      for (const playerId of selectedPlayers) {
        await db.deleteScorecard(playerId, selectedCourse.id);
      }
      
      alert('Scorecard(s) deleted successfully!');
      await loadScores(); // Reload to show updated data
    } catch (error) {
      console.error('Error deleting scorecard:', error);
      alert('Error deleting scorecard: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const calculateTotal = (playerId, startHole, endHole, useNet = false, useStableford = false) => {
    const playerScores = scores[playerId] || [];
    const player = users.find(u => u.id === playerId);
    
    if (!player) return '';
    
    const courseKey = getCourseKey(selectedCourse?.name || '');
    const courseHandicap = calculateCourseHandicap(player.handicap, courseKey);
    const holeData = getHoleData();
    const handicapStrokes = allocateHandicapStrokes(courseHandicap, holeData);
    
    let total = 0;
    let validScores = 0;
    
    for (let i = startHole; i < endHole; i++) {
      const grossScore = parseInt(playerScores[i], 10);
      if (!isNaN(grossScore)) {
        if (useStableford) {
          // Calculate Stableford points for this hole
          const par = holeData[i]?.par || 4;
          const strokesReceived = handicapStrokes[i] || 0;
          const netScore = Math.max(1, grossScore - strokesReceived);
          const points = calculateStablefordPoints(netScore, par);
          total += points;
        } else if (useNet) {
          // For net scoring, we need to calculate the total gross first, then apply handicap
          total += grossScore;
        } else {
          total += grossScore;
        }
        validScores++;
      }
    }
    
    if (validScores === 0) return '';
    
    if (useNet && !useStableford) {
      // Calculate net total using USGA method
      const netTotal = calculateNetScore(total, Math.round(courseHandicap * (validScores / 18)));
      return netTotal;
    }
    
    return total;
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
  const courseKey = getCourseKey(selectedCourse?.name || '');
  const courseData = courseRatings[courseKey];

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
          {courseData && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-sm">
                <strong>Course Info:</strong> Par {courseData.par} | 
                Course Rating: {courseData.courseRating} | 
                Slope Rating: {courseData.slopeRating}
              </p>
            </div>
          )}
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
                  {user.name} {user.surname} (HCP: {user.handicap})
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
              <div className="flex items-center gap-4">
                <h3>{selectedCourse.name}</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="form-label mb-0">
                      <input
                        type="radio"
                        name="scoringMode"
                        value="stroke"
                        checked={scoringMode === 'stroke'}
                        onChange={(e) => setScoringMode(e.target.value)}
                        className="mr-2"
                      />
                      Stroke Play
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="form-label mb-0">
                      <input
                        type="radio"
                        name="scoringMode"
                        value="stableford"
                        checked={scoringMode === 'stableford'}
                        onChange={(e) => setScoringMode(e.target.value)}
                        className="mr-2"
                      />
                      Stableford
                    </label>
                  </div>
                  {scoringMode === 'stroke' && (
                    <div className="flex items-center gap-2">
                      <label className="form-label mb-0">
                        <input
                          type="checkbox"
                          checked={showNet}
                          onChange={(e) => setShowNet(e.target.checked)}
                          className="mr-2"
                        />
                        Show Net Scores
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  className="btn btn--secondary"
                  onClick={handleDeleteScorecard}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Scorecard'}
                </button>
                <button
                  className="btn btn--primary"
                  onClick={handleSaveScorecard}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Scorecard'}
                </button>
              </div>
            </div>

            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              {scoringMode === 'stableford' ? (
                <p className="text-sm text-yellow-800">
                  <strong>Stableford Scoring:</strong><br/>
                  • <strong>Points:</strong> Albatross=5, Eagle=4, Birdie=3, Par=2, Bogey=1, Double+=0<br/>
                  • <strong>Net Score per Hole:</strong> Gross Strokes - Handicap Strokes on that hole<br/>
                  • <strong>Handicap Strokes:</strong> Allocated by hole difficulty (Stroke Index)<br/>
                  • <strong>Course Handicap:</strong> {courseData ? `${Math.round(18 * (courseData.slopeRating / 113))} strokes for 18 HCP` : 'Calculated per player'}
                </p>
              ) : (
                <p className="text-sm text-yellow-800">
                  <strong>USGA Net Scoring:</strong> Net Score = Gross Score - Course Handicap (minimum 1)<br/>
                  <strong>Course Handicap</strong> = Handicap Index × (Slope Rating ÷ 113)<br/>
                  {courseData && (
                    <>
                      <strong>This Course:</strong> Slope Rating {courseData.slopeRating}, Course Rating {courseData.courseRating}
                    </>
                  )}
                </p>
              )}
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
                    const courseHandicap = player ? calculateCourseHandicap(player.handicap, courseKey) : 0;
                    const handicapStrokes = allocateHandicapStrokes(courseHandicap, holeData);
                    
                    // Calculate totals based on scoring mode
                    const outTotal = calculateTotal(playerId, 0, 9, showNet && scoringMode === 'stroke', scoringMode === 'stableford');
                    const inTotal = calculateTotal(playerId, 9, 18, showNet && scoringMode === 'stroke', scoringMode === 'stableford');
                    const grandTotal = outTotal && inTotal ? outTotal + inTotal : '';

                    return (
                      <tr key={playerId}>
                        <td className="font-medium">
                          {player?.name} {player?.surname}
                          <div className="text-xs text-gray-600">
                            HCP: {player?.handicap} | Course HCP: {courseHandicap}
                          </div>
                        </td>
                        {Array.from({ length: 18 }, (_, holeIndex) => {
                          const playerScores = scores[playerId] || [];
                          const grossValue = playerScores[holeIndex] || '';
                          const grossScore = parseInt(grossValue, 10);
                          const holeNumber = holeIndex + 1;
                          const extras = scoreExtras[playerId]?.[holeNumber] || {};
                          const strokesReceived = handicapStrokes[holeIndex] || 0;
                          
                          let className = 'score-par';
                          let displayValue = grossValue;
                          
                          if (!isNaN(grossScore)) {
                            const holeInfo = holeData[holeIndex];
                            const par = holeInfo?.par || 4;
                            
                            if (scoringMode === 'stableford') {
                              // For Stableford, show points and color based on points
                              const netScore = Math.max(1, grossScore - strokesReceived);
                              const points = calculateStablefordPoints(netScore, par);
                              displayValue = `${grossScore} (${points}pts)`;
                              
                              if (points >= 4) className = 'score-eagle';
                              else if (points === 3) className = 'score-birdie';
                              else if (points === 2) className = 'score-par';
                              else if (points === 1) className = 'score-bogey';
                              else className = 'score-double';
                            } else {
                              // Color based on gross score vs par (net coloring would be too complex per hole)
                              const diff = grossScore - par;
                              if (diff <= -2) className = 'score-eagle';
                              else if (diff === -1) className = 'score-birdie';
                              else if (diff === 0) className = 'score-par';
                              else if (diff === 1) className = 'score-bogey';
                              else if (diff >= 2) className = 'score-double';
                            }
                          }

                          return (
                            <td key={holeIndex} className={className}>
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  type="number"
                                  className="form-control"
                                  value={grossValue}
                                  onChange={(e) => handleScoreChange(playerId, holeIndex, e.target.value)}
                                  style={{ width: '4rem', textAlign: 'center' }}
                                  min="1"
                                  max="12"
                                  placeholder="1-12"
                                />
                                {scoringMode === 'stableford' && strokesReceived > 0 && (
                                  <div className="text-xs text-gray-600">
                                    +{strokesReceived}
                                  </div>
                                )}
                                <div className="flex gap-1">
                                  <label className="flex items-center text-xs cursor-pointer" title="3-Putt">
                                    <input
                                      type="checkbox"
                                      checked={extras.threePutt || false}
                                      onChange={(e) => handleExtraChange(playerId, holeNumber, 'threePutt', e.target.checked)}
                                      className="mr-1"
                                      style={{ transform: 'scale(0.8)' }}
                                    />
                                    3P
                                  </label>
                                  <label className="flex items-center text-xs cursor-pointer" title="Ring (Hit the Pin)">
                                    <input
                                      type="checkbox"
                                      checked={extras.ring || false}
                                      onChange={(e) => handleExtraChange(playerId, holeNumber, 'ring', e.target.checked)}
                                      className="mr-1"
                                      style={{ transform: 'scale(0.8)' }}
                                    />
                                    <span style={{ 
                                      display: 'inline-block',
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      border: '1px solid red',
                                      backgroundColor: 'transparent'
                                    }}></span>
                                  </label>
                                </div>
                              </div>
                            </td>
                          );
                        })}
                        <td className="font-bold">{outTotal}</td>
                        <td className="font-bold">{inTotal}</td>
                        <td className="font-bold">
                          {scoringMode === 'stableford' ? (
                            <div>
                              <div>{grandTotal} pts</div>
                            </div>
                          ) : showNet ? (
                            <div>
                              <div>Net: {grandTotal}</div>
                              <div className="text-xs text-gray-600">
                                Gross: {calculateTotal(playerId, 0, 18, false, false)}
                              </div>
                            </div>
                          ) : (
                            grandTotal
                          )}
                        </td>
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