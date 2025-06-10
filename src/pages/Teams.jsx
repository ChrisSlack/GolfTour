import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { db } from '../lib/supabase';

export default function Teams() {
  const { userProfile, isAdmin } = useAuth();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTour, setActiveTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedCaptain, setSelectedCaptain] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get active tour
      const { data: tour } = await db.getActiveTour();
      setActiveTour(tour);

      if (tour) {
        // Get teams for active tour
        const { data: teamsData } = await db.getTeams(tour.id);
        setTeams(teamsData || []);
      }

      // Get all users
      const { data: usersData } = await db.getUsers();
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading teams data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!activeTour || !newTeamName || !selectedCaptain) return;

    try {
      const { error } = await db.createTeam(activeTour.id, newTeamName, selectedCaptain);
      if (!error) {
        setNewTeamName('');
        setSelectedCaptain('');
        setShowCreateForm(false);
        loadData(); // Reload teams
      }
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleAddMember = async (teamId, userId) => {
    try {
      const { error } = await db.addTeamMember(teamId, userId);
      if (!error) {
        loadData(); // Reload teams
      }
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    try {
      const { error } = await db.removeTeamMember(teamId, userId);
      if (!error) {
        loadData(); // Reload teams
      }
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const getAvailableUsers = (teamId) => {
    const teamMemberIds = teams
      .find(t => t.id === teamId)
      ?.team_members?.map(tm => tm.user.id) || [];
    
    return users.filter(user => !teamMemberIds.includes(user.id));
  };

  if (loading) {
    return (
      <section className="page active">
        <div className="text-center">Loading teams...</div>
      </section>
    );
  }

  if (!activeTour) {
    return (
      <section className="page active">
        <h2>Teams</h2>
        <div className="card mt-8">
          <div className="card__body">
            <p>No active tour found. Please contact an administrator.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page active" id="teams">
      <div className="flex justify-between items-center mb-8">
        <h2>Teams - {activeTour.name} {activeTour.year}</h2>
        {isAdmin && (
          <button
            className="btn btn--primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create Team
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="card mb-8">
          <div className="card__body">
            <h3>Create New Team</h3>
            <form onSubmit={handleCreateTeam} className="mt-4">
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Captain</label>
                <select
                  className="form-control"
                  value={selectedCaptain}
                  onChange={(e) => setSelectedCaptain(e.target.value)}
                  required
                >
                  <option value="">Select Captain</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.surname} (Handicap: {user.handicap})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="btn btn--primary">
                  Create Team
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => (
          <div key={team.id} className="card">
            <div className="card__body">
              <h3 className="text-xl font-bold mb-4">{team.name}</h3>
              
              <div className="mb-4">
                <h4 className="font-semibold text-sm text-gray-600 mb-2">Captain</h4>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {team.captain?.name} {team.captain?.surname}
                  </span>
                  <span className="text-sm text-gray-500">👑</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-sm text-gray-600 mb-2">
                  Members ({team.team_members?.length || 0}/4)
                </h4>
                <div className="space-y-2">
                  {team.team_members?.map(member => (
                    <div key={member.user.id} className="flex justify-between items-center">
                      <span className="text-sm">
                        {member.user.name} {member.user.surname} 
                        <span className="text-gray-500 ml-1">({member.user.handicap})</span>
                      </span>
                      {(isAdmin || team.captain_id === userProfile?.id) && (
                        <button
                          className="text-red-600 hover:text-red-800 text-sm"
                          onClick={() => handleRemoveMember(team.id, member.user.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {(isAdmin || team.captain_id === userProfile?.id) && 
               (team.team_members?.length || 0) < 4 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Add Member</h4>
                  <select
                    className="form-control text-sm"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddMember(team.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Select player to add</option>
                    {getAvailableUsers(team.id).map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.surname} (Handicap: {user.handicap})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="card">
          <div className="card__body text-center">
            <p>No teams created yet.</p>
            {isAdmin && (
              <p className="text-sm text-gray-600 mt-2">
                Click "Create Team" to get started.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}