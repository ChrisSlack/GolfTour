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
      console.log('🔄 Auth initialization starting...');
      try {
        console.log('📡 Calling auth.getCurrentUser()...');
        // Get initial session
        const { data: { user: authUser }, error } = await auth.getCurrentUser();
        console.log('✅ auth.getCurrentUser() completed:', { 
          hasUser: !!authUser, 
          hasError: !!error,
          userId: authUser?.id 
        });
        
        if (!mounted) {
          console.log('⚠️ Component unmounted during auth check, aborting');
          return;
        }

        if (authUser) {
          console.log('👤 User found, setting user and loading profile...');
          setUser(authUser);
          await loadUserProfile(authUser.id, authUser.user_metadata);
        } else {
          console.log('👤 No user found, setting null state');
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('❌ Error during auth initialization:', error);
        if (mounted) {
          console.log('🧹 Clearing potentially corrupted session...');
          try {
            await auth.signOut();
            console.log('✅ Session cleared successfully');
          } catch (signOutError) {
            console.error('❌ Error clearing session:', signOutError);
          }
          setUser(null);
          setUserProfile(null);
        }
      } finally {
        if (mounted) {
          console.log('✅ Auth initialization complete, setting loading to false');
          setLoading(false);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state change event:', event, { hasSession: !!session });
      
      if (!mounted) {
        console.log('⚠️ Component unmounted during auth state change, aborting');
        return;
      }

      const authUser = session?.user ?? null;
      console.log('👤 Setting user from auth state change:', { hasUser: !!authUser, userId: authUser?.id });
      setUser(authUser);

      if (authUser) {
        console.log('📋 Loading user profile for authenticated user...');
        await loadUserProfile(authUser.id, authUser.user_metadata);
      } else {
        console.log('🚫 No user, clearing profile');
        setUserProfile(null);
      }
      
      console.log('✅ Auth state change complete, setting loading to false');
      setLoading(false);
    });

    return () => {
      console.log('🧹 Cleaning up auth provider');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId, userMetadata = {}) => {
    console.log('📋 Loading user profile for:', userId);
    try {
      const { data, error } = await db.getUserById(userId);
      
      if (error) {
        console.error('❌ Error loading user profile:', error);
        return;
      }

      if (data) {
        console.log('✅ User profile found:', data.name, data.surname);
        setUserProfile(data);
      } else {
        // Profile doesn't exist, create a minimal one
        console.log('🆕 Creating user profile for:', userId);
        
        const userData = {
          email: userMetadata?.email || '',
          name: userMetadata?.name || '',
          surname: userMetadata?.surname || '',
          handicap: parseInt(userMetadata?.handicap) || 18
        };
        
        console.log('📝 Creating profile with data:', userData);
        const { data: newProfile, error: createError } = await db.createUserProfile(userId, userData);
        if (!createError && newProfile) {
          console.log('✅ User profile created successfully');
          setUserProfile(newProfile);
        } else {
          console.error('❌ Error creating user profile:', createError);
        }
      }
    } catch (error) {
      console.error('❌ Error in loadUserProfile:', error);
    }
  };

  const signIn = async (email, password) => {
    console.log('🔐 Signing in user:', email);
    setLoading(true);
    try {
      const { data, error } = await auth.signIn(email, password);
      console.log('🔐 Sign in result:', { hasData: !!data, hasError: !!error });
      return { data, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, userData) => {
    console.log('📝 Signing up user:', email);
    setLoading(true);
    try {
      const { data, error } = await auth.signUp(email, password, userData);
      console.log('📝 Sign up result:', { hasData: !!data, hasError: !!error });
      return { data, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out user');
    setLoading(true);
    try {
      const { error } = await auth.signOut();
      console.log('🚪 Sign out result:', { hasError: !!error });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user logged in' };
    
    console.log('📝 Updating profile for:', user.id);
    try {
      const { data, error } = await db.updateUser(user.id, updates);
      if (!error && data) {
        console.log('✅ Profile updated successfully');
        setUserProfile(data);
      }
      return { data, error };
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      return { error: error.message };
    }
  };

  const promoteToAdmin = async (email) => {
    console.log('👑 Promoting user to admin:', email);
    try {
      const { data, error } = await db.promoteToAdmin(email);
      if (!error && user) {
        console.log('✅ User promoted to admin, reloading profile');
        // Reload user profile to get updated admin status
        await loadUserProfile(user.id, user.user_metadata);
      }
      return { data, error };
    } catch (error) {
      console.error('❌ Error promoting to admin:', error);
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