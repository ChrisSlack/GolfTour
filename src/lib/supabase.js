import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set up Supabase connection.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const auth = {
  signUp: async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: () => {
    return supabase.auth.getUser();
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helpers
export const db = {
  // Users
  getUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');
    return { data, error };
  },

  getUserById: async (id) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return { data, error };
  },

  createUserProfile: async (userId, userData) => {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: userData.email,
        name: userData.name || '',
        surname: userData.surname || '',
        handicap: userData.handicap || 18
      })
      .select()
      .single();
    return { data, error };
  },

  updateUser: async (id, updates) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  promoteToAdmin: async (email) => {
    const { data, error } = await supabase.rpc('promote_user_to_admin', {
      user_email: email
    });
    return { data, error };
  },

  // Tours
  getTours: async () => {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .order('year', { ascending: false });
    return { data, error };
  },

  getActiveTour: async () => {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();
    return { data, error };
  },

  createTour: async (name, year) => {
    // First, set all tours to inactive
    await supabase
      .from('tours')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    // Then create the new active tour
    const { data, error } = await supabase
      .from('tours')
      .insert({
        name,
        year,
        is_active: true
      })
      .select()
      .single();
    return { data, error };
  },

  // Courses
  getCourses: async (tourId) => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('tour_id', tourId)
      .order('play_date');
    return { data, error };
  },

  createCourse: async (tourId, name, par, holes, playDate) => {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        tour_id: tourId,
        name,
        par,
        holes,
        play_date: playDate
      })
      .select()
      .single();
    return { data, error };
  },

  // Teams
  getTeams: async (tourId) => {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        captain:captain_id(name, surname),
        team_members(
          user:user_id(id, name, surname, handicap)
        )
      `)
      .eq('tour_id', tourId)
      .order('name');
    return { data, error };
  },

  createTeam: async (tourId, name, captainId) => {
    const { data, error } = await supabase
      .from('teams')
      .insert({
        tour_id: tourId,
        name,
        captain_id: captainId
      })
      .select()
      .single();
    
    if (!error && data) {
      // Add captain as team member
      await supabase
        .from('team_members')
        .insert({
          team_id: data.id,
          user_id: captainId
        });
    }
    
    return { data, error };
  },

  addTeamMember: async (teamId, userId) => {
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId
      })
      .select()
      .single();
    return { data, error };
  },

  removeTeamMember: async (teamId, userId) => {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);
    return { error };
  },

  // Scores
  getScores: async (courseId, userId = null) => {
    let query = supabase
      .from('scores')
      .select(`
        *,
        user:user_id(name, surname)
      `)
      .eq('course_id', courseId)
      .order('hole_number');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    return { data, error };
  },

  saveScore: async (userId, courseId, holeNumber, strokes, recordedBy, threePutt = false, ring = false) => {
    const { data, error } = await supabase
      .from('scores')
      .upsert({
        user_id: userId,
        course_id: courseId,
        hole_number: holeNumber,
        strokes,
        recorded_by: recordedBy,
        three_putt: threePutt,
        ring: ring
      })
      .select()
      .single();
    return { data, error };
  },

  saveScorecard: async (userId, courseId, scores, recordedBy, scoreExtras = {}) => {
    const scoreData = scores.map((strokes, index) => {
      const holeNumber = index + 1;
      const extras = scoreExtras[holeNumber] || {};
      
      return {
        user_id: userId,
        course_id: courseId,
        hole_number: holeNumber,
        strokes: parseInt(strokes) || null,
        recorded_by: recordedBy,
        three_putt: extras.threePutt || false,
        ring: extras.ring || false
      };
    }).filter(score => score.strokes !== null);

    const { data, error } = await supabase
      .from('scores')
      .upsert(scoreData, {
        onConflict: 'user_id,course_id,hole_number'
      })
      .select();
    return { data, error };
  },

  deleteScorecard: async (userId, courseId) => {
    const { error } = await supabase
      .from('scores')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId);
    return { error };
  },

  // Get score statistics for leaderboard
  getScoreStatistics: async (courseId, userId = null) => {
    let query = supabase
      .from('scores')
      .select(`
        user_id,
        strokes,
        three_putt,
        ring,
        course:course_id(par, holes)
      `)
      .eq('course_id', courseId);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    return { data, error };
  },

  // Fines
  getFines: async (tourId) => {
    const { data, error } = await supabase
      .from('fines')
      .select(`
        *,
        user:user_id(name, surname),
        recorded_by_user:recorded_by(name, surname)
      `)
      .eq('tour_id', tourId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  addFine: async (userId, tourId, amount, reason, description, recordedBy) => {
    const { data, error } = await supabase
      .from('fines')
      .insert({
        user_id: userId,
        tour_id: tourId,
        amount,
        reason,
        description,
        recorded_by: recordedBy
      })
      .select()
      .single();
    return { data, error };
  }
};