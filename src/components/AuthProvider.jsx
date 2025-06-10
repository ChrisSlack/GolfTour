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
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { user: authUser } } = await auth.getCurrentUser();
        
        if (!mounted) return;

        if (authUser) {
          setUser(authUser);
          await loadUserProfile(authUser.id);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setUserProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const authUser = session?.user ?? null;
      setUser(authUser);

      if (authUser) {
        await loadUserProfile(authUser.id);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await db.getUserById(userId);
      
      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
      } else {
        // Profile doesn't exist, create a minimal one
        console.log('Creating user profile for:', userId);
        const { data: authUser } = await auth.getCurrentUser();
        
        if (authUser?.user) {
          const userData = {
            email: authUser.user.email,
            name: authUser.user.user_metadata?.name || '',
            surname: authUser.user.user_metadata?.surname || '',
            handicap: parseInt(authUser.user.user_metadata?.handicap) || 18
          };
          
          const { data: newProfile, error: createError } = await db.createUserProfile(userId, userData);
          if (!createError && newProfile) {
            setUserProfile(newProfile);
          } else {
            console.error('Error creating user profile:', createError);
          }
        }
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await auth.signIn(email, password);
      return { data, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, userData) => {
    setLoading(true);
    try {
      const { data, error } = await auth.signUp(email, password, userData);
      return { data, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await auth.signOut();
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user logged in' };
    
    try {
      const { data, error } = await db.updateUser(user.id, updates);
      if (!error && data) {
        setUserProfile(data);
      }
      return { data, error };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: error.message };
    }
  };

  const promoteToAdmin = async (email) => {
    try {
      const { data, error } = await db.promoteToAdmin(email);
      if (!error && user) {
        // Reload user profile to get updated admin status
        await loadUserProfile(user.id);
      }
      return { data, error };
    } catch (error) {
      console.error('Error promoting to admin:', error);
      return { error: error.message };
    }
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