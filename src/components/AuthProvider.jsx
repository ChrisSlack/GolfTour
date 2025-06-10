import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    auth.getCurrentUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        loadUserProfile(user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await db.getUserById(userId);
      
      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      if (!data) {
        // User profile doesn't exist, create it
        const authUser = await auth.getCurrentUser();
        if (authUser.data?.user) {
          const userData = {
            email: authUser.data.user.email,
            name: authUser.data.user.user_metadata?.name || '',
            surname: authUser.data.user.user_metadata?.surname || '',
            handicap: authUser.data.user.user_metadata?.handicap || 18
          };
          
          const { data: newProfile, error: createError } = await db.createUserProfile(userId, userData);
          if (!createError && newProfile) {
            setUserProfile(newProfile);
          }
        }
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  };

  const signIn = async (email, password) => {
    const { data, error } = await auth.signIn(email, password);
    return { data, error };
  };

  const signUp = async (email, password, userData) => {
    const { data, error } = await auth.signUp(email, password, userData);
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await auth.signOut();
    return { error };
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user logged in' };
    
    const { data, error } = await db.updateUser(user.id, updates);
    if (!error && data) {
      setUserProfile(data);
    }
    return { data, error };
  };

  const promoteToAdmin = async (email) => {
    const { data, error } = await db.promoteToAdmin(email);
    if (!error) {
      // Reload user profile to get updated admin status
      if (user) {
        await loadUserProfile(user.id);
      }
    }
    return { data, error };
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    promoteToAdmin,
    isAdmin: userProfile?.is_admin || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}