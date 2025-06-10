import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { db } from '../lib/supabase';

export default function Profile() {
  const { userProfile, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    handicap: 18
  });
  const [scores, setScores] = useState([]);
  const [fines, setFines] = useState([]);
  const [activeTour, setActiveTour] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        surname: userProfile.surname || '',
        handicap: userProfile.handicap || 18
      });
      loadUserData();
    }
  }, [userProfile]);

  const loadUserData = async () => {
    try {
      // Get active tour
      const { data: tour } = await db.getActiveTour();
      setActiveTour(tour);

      if (tour && userProfile) {
        // Get user's fines for this tour
        const { data: finesData } = await db.getFines(tour.id);
        const userFines = finesData?.filter(fine => fine.user_id === userProfile.id) || [];
        setFines(userFines);

        // Get courses for this tour
        const { data: courses } = await db.getCourses(tour.id);
        
        // Get user's scores for all courses
        const allScores = [];
        for (const course of courses || []) {
          const { data: courseScores } = await db.getScores(course.id, userProfile.id);
          if (courseScores?.length > 0) {
            allScores.push({
              course: course.name,
              scores: courseScores,
              par: course.par
            });
          }
        }
        setScores(allScores);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateTotal = (courseScores) => {
    return courseScores.reduce((total, score) => total + score.strokes, 0);
  };

  if (loading) {
    return (
      <section className="page active">
        <div className="text-center">Loading profile...</div>
      </section>
    );
  }

  if (!userProfile) {
    return (
      <section className="page active">
        <h2>Profile</h2>
        <div className="card mt-8">
          <div className="card__body">
            <p>Please sign in to view your profile.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page active" id="profile">
      <h2>My Profile</h2>

      {/* Profile Information */}
      <div className="card mt-8">
        <div className="card__body">
          <div className="flex justify-between items-center mb-4">
            <h3>Personal Information</h3>
            <button
              className="btn btn--secondary"
              onClick={() => setEditing(!editing)}
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="surname"
                  className="form-control"
                  value={formData.surname}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Handicap</label>
                <input
                  type="number"
                  name="handicap"
                  className="form-control"
                  value={formData.handicap}
                  onChange={handleChange}
                  min="0"
                  max="54"
                  required
                />
              </div>
              <button type="submit" className="btn btn--primary">
                Save Changes
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <strong>Name:</strong> {userProfile.name} {userProfile.surname}
              </div>
              <div>
                <strong>Email:</strong> {userProfile.email}
              </div>
              <div>
                <strong>Handicap:</strong> {userProfile.handicap}
              </div>
              <div>
                <strong>Member since:</strong> {new Date(userProfile.created_at).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Score History */}
      <div className="card mt-8">
        <div className="card__body">
          <h3>Score History</h3>
          {scores.length > 0 ? (
            <div className="mt-4 space-y-6">
              {scores.map((courseData, index) => (
                <div key={index}>
                  <h4 className="font-semibold mb-2">{courseData.course}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Hole</th>
                          {Array.from({ length: 18 }, (_, i) => (
                            <th key={i} className="text-center p-1">{i + 1}</th>
                          ))}
                          <th className="text-center p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 font-medium">Score</td>
                          {Array.from({ length: 18 }, (_, i) => {
                            const score = courseData.scores.find(s => s.hole_number === i + 1);
                            return (
                              <td key={i} className="text-center p-1">
                                {score ? score.strokes : '-'}
                              </td>
                            );
                          })}
                          <td className="text-center p-2 font-bold">
                            {calculateTotal(courseData.scores)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-gray-600">No scores recorded yet.</p>
          )}
        </div>
      </div>

      {/* Fine History */}
      <div className="card mt-8">
        <div className="card__body">
          <h3>Fine History</h3>
          {fines.length > 0 ? (
            <div className="mt-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Reason</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-right p-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {fines.map(fine => (
                    <tr key={fine.id} className="border-b">
                      <td className="p-2">{new Date(fine.created_at).toLocaleDateString()}</td>
                      <td className="p-2">{fine.reason}</td>
                      <td className="p-2">{fine.description || '-'}</td>
                      <td className="p-2 text-right">€{fine.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-right">
                <strong>
                  Total Fines: €{fines.reduce((sum, fine) => sum + parseFloat(fine.amount), 0).toFixed(2)}
                </strong>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-gray-600">No fines recorded yet. Keep it up!</p>
          )}
        </div>
      </div>
    </section>
  );
}