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
  
  // Mobile-specific state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState('overview'); // 'overview', 'hole-entry'
  const [currentHole, setCurrentHole] = useState(1);
  const [currentPlayer, setCurrentPlayer] = useState(0);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      return Math.round(handicapIndex);
    }
    const courseHandicap = handicapIndex * (courseData.slopeRating / 113) + (courseData.courseRating - courseData.par);
    return Math.round(courseHandicap);
  };

  // Calculate net score using USGA method
  const calculateNetScore = (grossScore, courseHandicap) => {
    return Math.max(1, grossScore - courseHandicap);
  };

  // Calculate Stableford points
  const calculateStablefordPoints = (netScore, par) => {
    const diff = netScore - par;
    if (diff <= -3) return 5; // Albatross/Double Eagle
    if (diff === -2) return 4; // Eagle
    if (diff === -1) return 3; // Birdie
    if (diff === 0) return 2;  // Par
    if (diff === 1) return 1;  // Bogey
    return 0; // Double bogey or worse
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
      const { data: tour } = await db.getActiveTour();
      setActiveTour(tour);

      if (tour) {
        const { data: coursesData } = await db.getCourses(tour.id);
        setCourses(coursesData || []);
        
        if (coursesData && coursesData.length > 0) {
          setSelectedCourse(coursesData[0]);
        }
      }

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
      
      const organizedScores = {};
      const organizedExtras = {};
      
      selectedPlayers.forEach(playerId => {
        organizedScores[playerId] = Array(18).fill('');
        organizedExtras[playerId] = {};
      });

      scoresData?.forEach(score => {
        if (organizedScores[score.user_id]) {
          organizedScores[score.user_id][score.hole_number - 1] = score.strokes.toString();
          
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
    const numValue = parseInt(value, 10);
    if (value !== '' && (isNaN(numValue) || numValue < 1 || numValue > 12)) {
      return;
    }

    setScores(prev => {
      const currentPlayerScores = prev[playerId] || Array(18).fill('');
      const newPlayerScores = [...currentPlayerScores];
      newPlayerScores[holeIndex] = value;
      
      return {
        ...prev,
        [playerId]: newPlayerScores
      };
    });
  };

  const handleMobileScoreEntry = (score) => {
    if (selectedPlayers.length === 0) return;
    
    const playerId = selectedPlayers[currentPlayer];
    const holeIndex = currentHole - 1;
    
    handleScoreChange(playerId, holeIndex, score.toString());
    
    // Auto-advance to next player or hole
    if (currentPlayer < selectedPlayers.length - 1) {
      setCurrentPlayer(currentPlayer + 1);
    } else if (currentHole < 18) {
      setCurrentPlayer(0);
      setCurrentHole(currentHole + 1);
    } else {
      // Finished round
      setMobileView('overview');
    }
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
      for (const playerId of selectedPlayers) {
        const playerScores = scores[playerId] || Array(18).fill('');
        const playerExtras = scoreExtras[playerId] || {};
        await db.saveScorecard(playerId, selectedCourse.id, playerScores, user.id, playerExtras);
      }
      
      alert('Scorecard saved successfully!');
      await loadScores();
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
      await loadScores();
    } catch (error) {
      console.error('Error deleting scorecard:', error);
      alert('Error deleting scorecard: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const getHoleData = () => {
    if (!selectedCourse) return [];
    
    const courseKey = Object.keys(scorecards).find(key => 
      scorecards[key].name.toLowerCase().includes(selectedCourse.name.toLowerCase()) ||
      selectedCourse.name.toLowerCase().includes(key.toLowerCase())
    );
    
    if (courseKey && scorecards[courseKey]) {
      return scorecards[courseKey].holes;
    }
    
    return selectedCourse.holes || Array(18).fill({ par: 4, hcp: 1 });
  };

  const getCurrentPlayer = () => {
    if (selectedPlayers.length === 0) return null;
    return users.find(u => u.id === selectedPlayers[currentPlayer]);
  };

  const getCurrentHoleData = () => {
    const holeData = getHoleData();
    return holeData[currentHole - 1] || { par: 4, hcp: 1 };
  };

  const getScoreLabel = (score, par) => {
    const diff = score - par;
    if (diff <= -3) return 'Albatross';
    if (diff === -2) return 'Eagle';
    if (diff === -1) return 'Birdie';
    if (diff === 0) return 'Par';
    if (diff === 1) return 'Bogey';
    if (diff === 2) return 'Double Bogey';
    return `+${diff}`;
  };

  const calculateTotal = (playerId, startHole, endHole) => {
    const playerScores = scores[playerId] || [];
    let total = 0;
    let validScores = 0;
    
    for (let i = startHole; i < endHole; i++) {
      const score = parseInt(playerScores[i], 10);
      if (!isNaN(score)) {
        total += score;
        validScores++;
      }
    }
    
    return validScores === 0 ? '' : total;
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

  // Mobile Hole Entry View
  if (isMobile && mobileView === 'hole-entry' && selectedCourse && selectedPlayers.length > 0) {
    const currentPlayerData = getCurrentPlayer();
    const currentHoleData = getCurrentHoleData();
    
    if (!currentPlayerData) {
      return (
        <section className="page active mobile-scorecard">
          <div className="mobile-header">
            <button 
              className="mobile-back-btn"
              onClick={() => setMobileView('overview')}
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="mobile-hole-info">
              <h2>HOLE {currentHole} | PAR {currentHoleData.par}</h2>
            </div>
          </div>
          <div className="mobile-error">
            <p>No player selected</p>
          </div>
        </section>
      );
    }

    const currentScore = scores[currentPlayerData.id]?.[currentHole - 1];
    const currentScoreNum = currentScore ? parseInt(currentScore) : null;

    return (
      <section className="page active mobile-scorecard">
        <div className="mobile-header">
          <button 
            className="mobile-back-btn"
            onClick={() => setMobileView('overview')}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="mobile-hole-info">
            <h2>HOLE {currentHole} | PAR {currentHoleData.par}</h2>
            <div className="mobile-hole-hcp">HCP {currentHoleData.hcp}</div>
          </div>
        </div>

        <div className="mobile-player-info">
          <div className="player-name">{currentPlayerData.name} {currentPlayerData.surname}</div>
          <div className="player-handicap">HCP {currentPlayerData.handicap}</div>
          <div className="player-score-display">
            {currentScore ? (
              <div className="current-score">
                <span className="score-number">{currentScore}</span>
                <span className="score-label">
                  {getScoreLabel(parseInt(currentScore), currentHoleData.par)}
                </span>
              </div>
            ) : (
              <span className="no-score">Tap to enter score</span>
            )}
          </div>
        </div>

        <div className="mobile-score-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(scoreValue => {
            const diff = scoreValue - currentHoleData.par;
            let label = '';
            let isParScore = false;
            
            if (diff <= -3) label = 'Albatross';
            else if (diff === -2) label = 'Eagle';
            else if (diff === -1) label = 'Birdie';
            else if (diff === 0) {
              label = 'Par';
              isParScore = true;
            }
            else if (diff === 1) label = 'Bogey';
            else if (diff === 2) label = 'Double Bogey';
            else if (diff >= 3) label = `+${diff}`;

            return (
              <button 
                key={scoreValue}
                className={`mobile-score-btn ${isParScore ? 'mobile-score-btn--par' : ''} ${currentScoreNum === scoreValue ? 'mobile-score-btn--selected' : ''}`}
                onClick={() => handleMobileScoreEntry(scoreValue)}
              >
                <span className="score-number">{scoreValue}</span>
                {label && <span className="score-label">{label}</span>}
              </button>
            );
          })}
        </div>

        <div className="mobile-actions">
          <button 
            className="mobile-action-btn mobile-action-btn--clear"
            onClick={() => handleMobileScoreEntry('')}
          >
            Clear Score
          </button>
        </div>

        <div className="mobile-navigation">
          <button 
            className="mobile-nav-btn"
            onClick={() => {
              if (currentPlayer > 0) {
                setCurrentPlayer(currentPlayer - 1);
              } else if (currentHole > 1) {
                setCurrentHole(currentHole - 1);
                setCurrentPlayer(selectedPlayers.length - 1);
              }
            }}
            disabled={currentHole === 1 && currentPlayer === 0}
          >
            <i className="fas fa-chevron-left"></i>
            <span>Previous</span>
          </button>
          
          <div className="mobile-nav-info">
            <div className="player-indicator">
              Player {currentPlayer + 1} of {selectedPlayers.length}
            </div>
            <div className="hole-indicator">
              Hole {currentHole} of 18
            </div>
          </div>
          
          <button 
            className="mobile-nav-btn"
            onClick={() => {
              if (currentPlayer < selectedPlayers.length - 1) {
                setCurrentPlayer(currentPlayer + 1);
              } else if (currentHole < 18) {
                setCurrentHole(currentHole + 1);
                setCurrentPlayer(0);
              } else {
                setMobileView('overview');
              }
            }}
            disabled={currentHole === 18 && currentPlayer === selectedPlayers.length - 1}
          >
            <span>{currentHole === 18 && currentPlayer === selectedPlayers.length - 1 ? 'Finish' : 'Next'}</span>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>
    );
  }

  // Mobile Overview or Desktop View
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
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
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

      {/* Mobile Entry Button */}
      {isMobile && selectedCourse && selectedPlayers.length > 0 && (
        <div className="card mt-8">
          <div className="card__body text-center">
            <button
              className="btn btn--primary btn--lg btn--full-width mobile-start-btn"
              onClick={() => {
                setCurrentHole(1);
                setCurrentPlayer(0);
                setMobileView('hole-entry');
              }}
            >
              <i className="fas fa-golf-ball"></i>
              <span>Start Scoring</span>
            </button>
            
            {/* Mobile Save/Delete Actions */}
            <div className="mobile-actions-row">
              <button
                className="btn btn--secondary"
                onClick={handleDeleteScorecard}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Scores'}
              </button>
              <button
                className="btn btn--primary"
                onClick={handleSaveScorecard}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Scores'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Scorecard Table */}
      {!isMobile && selectedCourse && selectedPlayers.length > 0 && (
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
                    
                    return (
                      <tr key={playerId}>
                        <td className="font-medium">
                          {player?.name} {player?.surname}
                          <div className="text-xs text-gray-600">
                            HCP: {player?.handicap}
                          </div>
                        </td>
                        {Array.from({ length: 18 }, (_, holeIndex) => {
                          const playerScores = scores[playerId] || [];
                          const grossValue = playerScores[holeIndex] || '';
                          const grossScore = parseInt(grossValue, 10);
                          const holeNumber = holeIndex + 1;
                          const extras = scoreExtras[playerId]?.[holeNumber] || {};
                          
                          let className = 'score-par';
                          
                          if (!isNaN(grossScore)) {
                            const holeInfo = holeData[holeIndex];
                            const par = holeInfo?.par || 4;
                            const diff = grossScore - par;
                            
                            if (diff <= -2) className = 'score-eagle';
                            else if (diff === -1) className = 'score-birdie';
                            else if (diff === 0) className = 'score-par';
                            else if (diff === 1) className = 'score-bogey';
                            else if (diff >= 2) className = 'score-double';
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
                        <td className="font-bold">{calculateTotal(playerId, 0, 9)}</td>
                        <td className="font-bold">{calculateTotal(playerId, 9, 18)}</td>
                        <td className="font-bold">{calculateTotal(playerId, 0, 18)}</td>
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