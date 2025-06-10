import React, { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import courseRatings from '../data/courseRatings';

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [activeTour, setActiveTour] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [showNet, setShowNet] = useState(false);

  useEffect(() => {
    loadLeaderboardData();
  }, [selectedCourse, showNet]);

  // Calculate course handicap using USGA formula
  const calculateCourseHandicap = (handicapIndex, courseKey) => {
    const courseData = courseRatings[courseKey];
    if (!courseData) {
      // Fallback to simplified calculation if course data not found
      return Math.round(handicapIndex);
    }

    // USGA Formula: Course Handicap = Handicap Index × (Slope Rating ÷ 113)
    // Note: We're not adding (Course Rating - Par) as it's typically used for different tee calculations
    const courseHandicap = handicapIndex * (courseData.slopeRating / 113);
    return Math.round(courseHandicap);
  };

  // Calculate net score using USGA method (simple subtraction)
  const calculateNetScore = (grossScore, courseHandicap) => {
    // Under USGA rules: Net Score = Gross Score - Course Handicap
    // Minimum net score is 1 (can't go below 1)
    return Math.max(1, grossScore - courseHandicap);
  };

  // Get course key from course name
  const getCourseKey = (courseName) => {
    const name = courseName.toLowerCase();
    if (name.includes('morgado')) return 'morgado';
    if (name.includes('amendoeira') || name.includes('faldo')) return 'amendoeira';
    if (name.includes('quinta') || name.includes('lago')) return 'quintadolago';
    return null;
  };

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);

      // Get active tour
      const { data: tour } = await db.getActiveTour();
      setActiveTour(tour);

      if (!tour) {
        setLoading(false);
        return;
      }

      // Get courses for the tour
      const { data: coursesData } = await db.getCourses(tour.id);
      setCourses(coursesData || []);

      // Get teams with members
      const { data: teamsData } = await db.getTeams(tour.id);
      
      if (!teamsData || teamsData.length === 0) {
        setLeaderboardData([]);
        setLoading(false);
        return;
      }

      // Get scores for all courses or selected course
      const coursesToQuery = selectedCourse === 'all' 
        ? coursesData || []
        : coursesData?.filter(c => c.id === selectedCourse) || [];

      const teamScores = [];

      for (const team of teamsData) {
        const teamData = {
          id: team.id,
          name: team.name,
          captain: team.captain,
          members: [],
          totalGrossScore: 0,
          totalNetScore: 0,
          totalPar: 0,
          coursesPlayed: 0
        };

        // Process each team member
        for (const member of team.team_members || []) {
          const memberData = {
            id: member.user.id,
            name: `${member.user.name} ${member.user.surname}`,
            handicap: member.user.handicap,
            scores: [],
            totalGrossScore: 0,
            totalNetScore: 0,
            totalPar: 0,
            coursesPlayed: 0
          };

          // Get scores for each course
          for (const course of coursesToQuery) {
            const { data: scoresData } = await db.getScores(course.id, member.user.id);
            
            if (scoresData && scoresData.length > 0) {
              const coursePar = course.par || 72;
              const courseKey = getCourseKey(course.name);
              
              // Calculate course handicap for this specific course
              const courseHandicap = calculateCourseHandicap(member.user.handicap, courseKey);
              
              // Calculate gross total
              const courseGrossTotal = scoresData.reduce((sum, score) => sum + score.strokes, 0);
              
              // Calculate net total using USGA method
              const courseNetTotal = calculateNetScore(courseGrossTotal, courseHandicap);
              
              memberData.scores.push({
                courseId: course.id,
                courseName: course.name,
                courseKey: courseKey,
                grossTotal: courseGrossTotal,
                netTotal: courseNetTotal,
                par: coursePar,
                courseHandicap: courseHandicap,
                grossToPar: courseGrossTotal - coursePar,
                netToPar: courseNetTotal - coursePar
              });
              
              memberData.totalGrossScore += courseGrossTotal;
              memberData.totalNetScore += courseNetTotal;
              memberData.totalPar += coursePar;
              memberData.coursesPlayed++;
            }
          }

          teamData.members.push(memberData);
          teamData.totalGrossScore += memberData.totalGrossScore;
          teamData.totalNetScore += memberData.totalNetScore;
          teamData.totalPar += memberData.totalPar;
        }

        // Calculate team average courses played
        if (teamData.members.length > 0) {
          teamData.coursesPlayed = Math.max(...teamData.members.map(m => m.coursesPlayed));
        }

        teamScores.push(teamData);
      }

      // Sort teams by total score (lower is better) - use net or gross based on toggle
      teamScores.sort((a, b) => {
        const aScore = showNet ? a.totalNetScore : a.totalGrossScore;
        const bScore = showNet ? b.totalNetScore : b.totalGrossScore;
        
        if (aScore === 0 && bScore === 0) return 0;
        if (aScore === 0) return 1;
        if (bScore === 0) return -1;
        return aScore - bScore;
      });

      setLeaderboardData(teamScores);
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (grossScore, netScore, par, useNet = false) => {
    const score = useNet ? netScore : grossScore;
    if (score === 0) return '-';
    const toPar = score - par;
    if (toPar === 0) return `${score} (E)`;
    if (toPar > 0) return `${score} (+${toPar})`;
    return `${score} (${toPar})`;
  };

  const getTeamRankIcon = (index, totalTeams) => {
    if (index === 0 && leaderboardData[0].totalGrossScore > 0) {
      return <span className="text-2xl" title="Best Team">👑</span>;
    }
    if (index === totalTeams - 1 && leaderboardData[index].totalGrossScore > 0) {
      return <span className="text-2xl" title="Needs Improvement">👎</span>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card__body text-center">
          <div className="text-xl text-gray-600">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (!activeTour) {
    return (
      <div className="card">
        <div className="card__body text-center">
          <p>No active tour found.</p>
        </div>
      </div>
    );
  }

  if (leaderboardData.length === 0) {
    return (
      <div className="card">
        <div className="card__body text-center">
          <p>No team scores available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card__body">
        <div className="flex justify-between items-center mb-6">
          <h3>Team Leaderboard - {activeTour.name} {activeTour.year}</h3>
          <div className="flex gap-4 items-center">
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
            <div className="form-group mb-0" style={{ minWidth: '200px' }}>
              <select
                className="form-control"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>USGA Net Scoring:</strong><br/>
            • <strong>Course Handicap</strong> = Handicap Index × (Slope Rating ÷ 113)<br/>
            • <strong>Net Score</strong> = Gross Score - Course Handicap (minimum 1)<br/>
            • Course ratings: Morgado (Slope: 129), Amendoeira (Slope: 142), Quinta do Lago (Slope: 139)
          </p>
        </div>

        <div className="space-y-6">
          {leaderboardData.map((team, teamIndex) => (
            <div key={team.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-primary">
                      #{teamIndex + 1}
                    </div>
                    {getTeamRankIcon(teamIndex, leaderboardData.length)}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">{team.name}</h4>
                    <p className="text-sm text-gray-600">
                      Captain: {team.captain?.name} {team.captain?.surname}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {team.totalGrossScore > 0 ? formatScore(
                      team.totalGrossScore, 
                      team.totalNetScore, 
                      team.totalPar, 
                      showNet
                    ) : '-'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Team Total ({showNet ? 'Net' : 'Gross'})
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Player</th>
                      <th className="text-center p-2">HCP Index</th>
                      {selectedCourse === 'all' ? (
                        courses.map(course => {
                          const courseKey = getCourseKey(course.name);
                          const courseData = courseRatings[courseKey];
                          return (
                            <th key={course.id} className="text-center p-2 min-w-24">
                              {course.name.split(' ')[0]}
                              {courseData && (
                                <div className="text-xs text-gray-500">
                                  Slope: {courseData.slopeRating}
                                </div>
                              )}
                            </th>
                          );
                        })
                      ) : (
                        <th className="text-center p-2">
                          {showNet ? 'Net' : 'Gross'} Score
                          {selectedCourse !== 'all' && (() => {
                            const course = courses.find(c => c.id === selectedCourse);
                            const courseKey = getCourseKey(course?.name || '');
                            const courseData = courseRatings[courseKey];
                            return courseData ? (
                              <div className="text-xs text-gray-500">
                                Slope: {courseData.slopeRating}
                              </div>
                            ) : null;
                          })()}
                        </th>
                      )}
                      <th className="text-center p-2 font-bold">Total ({showNet ? 'Net' : 'Gross'})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.members
                      .sort((a, b) => {
                        const aScore = showNet ? a.totalNetScore : a.totalGrossScore;
                        const bScore = showNet ? b.totalNetScore : b.totalGrossScore;
                        
                        if (aScore === 0 && bScore === 0) return 0;
                        if (aScore === 0) return 1;
                        if (bScore === 0) return -1;
                        return aScore - bScore;
                      })
                      .map(member => (
                        <tr key={member.id} className="border-b">
                          <td className="p-2 font-medium">{member.name}</td>
                          <td className="p-2 text-center">{member.handicap}</td>
                          {selectedCourse === 'all' ? (
                            courses.map(course => {
                              const courseScore = member.scores.find(s => s.courseId === course.id);
                              return (
                                <td key={course.id} className="p-2 text-center">
                                  {courseScore ? (
                                    <div>
                                      <div>
                                        {formatScore(
                                          courseScore.grossTotal, 
                                          courseScore.netTotal, 
                                          courseScore.par, 
                                          showNet
                                        )}
                                      </div>
                                      {showNet && courseScore.courseHandicap && (
                                        <div className="text-xs text-gray-500">
                                          CH: {courseScore.courseHandicap}
                                        </div>
                                      )}
                                    </div>
                                  ) : '-'}
                                </td>
                              );
                            })
                          ) : (
                            <td className="p-2 text-center">
                              {member.scores.length > 0 ? (
                                <div>
                                  <div>
                                    {formatScore(
                                      member.scores[0].grossTotal, 
                                      member.scores[0].netTotal, 
                                      member.scores[0].par, 
                                      showNet
                                    )}
                                  </div>
                                  {showNet && member.scores[0].courseHandicap && (
                                    <div className="text-xs text-gray-500">
                                      Course HCP: {member.scores[0].courseHandicap}
                                    </div>
                                  )}
                                </div>
                              ) : '-'}
                            </td>
                          )}
                          <td className="p-2 text-center font-bold">
                            {member.totalGrossScore > 0 ? formatScore(
                              member.totalGrossScore, 
                              member.totalNetScore, 
                              member.totalPar, 
                              showNet
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}