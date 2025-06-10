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
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedCaptain, setSelectedCaptain] = useState('');
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    name: '',
    surname: '',
    handicap: 18
  });

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

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // Create a temporary user ID for the profile
      const tempUserId = crypto.randomUUID();
      
      const { data, error } = await db.createUserProfile(tempUserId, newUserForm);
      if (!error) {
        setNewUserForm({
          email: '',
          name: '',
          surname: '',
          handicap: 18
        });
        setShowAddUserForm(false);
        loadData(); // Reload users
      } else {
        console.error('Error adding user:', error);
        alert('Error adding user: ' + error.message);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error adding user: ' + error.message);
    }
  };

  const handleAddMember = async (teamId, userId) => {
    try {
      // Check if user is already in another team
      const userCurrentTeam = teams.find(team => 
        team.team_members?.some(member => member.user.id === userId)
      );

      if (userCurrentTeam) {
        const confirmSwitch = window.confirm(
          `This user is already in team "${userCurrentTeam.name}". Do you want to move them to this team?`
        );
        
        if (confirmSwitch) {
          // Remove from current team first
          await db.removeTeamMember(userCurrentTeam.id, userId);
        } else {
          return;
        }
      }

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

  const handleSwitchTeam = async (userId, newTeamId) => {
    try {
      // Find current team
      const currentTeam = teams.find(team => 
        team.team_members?.some(member => member.user.id === userId)
      );

      if (currentTeam) {
        // Remove from current team
        await db.removeTeamMember(currentTeam.id, userId);
      }

      // Add to new team
      await db.addTeamMember(newTeamId, userId);
      loadData(); // Reload teams
    } catch (error) {
      console.error('Error switching team:', error);
      alert('Error switching team: ' + error.message);
    }
  };

  const getAvailableUsers = (teamId) => {
    const teamMemberIds = teams
      .find(t => t.id === teamId)
      ?.team_members?.map(tm => tm.user.id) || [];
    
    return users.filter(user => !teamMemberIds.includes(user.id));
  };

  const getUserCurrentTeam = (userId) => {
    return teams.find(team => 
      team.team_members?.some(member => member.user.id === userId)
    );
  };

  const getAvailableTeamsForUser = (userId) => {
    return teams.filter(team => {
      const teamMemberCount = team.team_members?.length || 0;
      const isUserInTeam = team.team_members?.some(member => member.user.id === userId);
      return teamMemberCount < 4 && !isUserInTeam;
    });
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
        <div className="flex gap-4">
          {isAdmin && (
            <>
              <button
                className="btn btn--secondary"
                onClick={() => setShowAddUserForm(true)}
              >
                Add User
              </button>
              <button
                className="btn btn--primary"
                onClick={() => setShowCreateForm(true)}
              >
                Create Team
              </button>
            </>
          )}
        </div>
      </div>

      {showAddUserForm && (
        <div className="card mb-8">
          <div className="card__body">
            <h3>Add New User</h3>
            <form onSubmit={handleAddUser} className="mt-4">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={newUserForm.surname}
                  onChange={(e) => setNewUserForm({...newUserForm, surname: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Handicap (0-54)</label>
                <input
                  type="number"
                  className="form-control"
                  value={newUserForm.handicap}
                  onChange={(e) => setNewUserForm({...newUserForm, handicap: parseInt(e.target.value)})}
                  min="0"
                  max="54"
                  required
                />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="btn btn--primary">
                  Add User
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowAddUserForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Users List with Team Switching */}
      <div className="card mt-8">
        <div className="card__body">
          <h3>All Users ({users.length})</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-center p-2">Handicap</th>
                  <th className="text-left p-2">Current Team</th>
                  <th className="text-left p-2">Switch Team</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const userTeam = getUserCurrentTeam(user.id);
                  const availableTeams = getAvailableTeamsForUser(user.id);
                  
                  return (
                    <tr key={user.id} className="border-b">
                      <td className="p-2">{user.name} {user.surname}</td>
                      <td className="p-2">{user.email}</td>
                      <td className="p-2 text-center">{user.handicap}</td>
                      <td className="p-2">
                        {userTeam ? (
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {userTeam.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">No team</span>
                        )}
                      </td>
                      <td className="p-2">
                        {(isAdmin || userProfile?.id === user.id) && availableTeams.length > 0 && (
                          <select
                            className="form-control text-sm"
                            onChange={(e) => {
                              if (e.target.value) {
                                handleSwitchTeam(user.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                          >
                            <option value="">
                              {userTeam ? 'Switch to...' : 'Join team...'}
                            </option>
                            {availableTeams.map(team => (
                              <option key={team.id} value={team.id}>
                                {team.name} ({team.team_members?.length || 0}/4)
                              </option>
                            ))}
                          </select>
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
    </section>
  );
}