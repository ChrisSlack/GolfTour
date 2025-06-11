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

// Timeout wrapper for operations that might hang
const withTimeout = (promise, timeoutMs = 10000, operation = 'Operation') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
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
        
        // Increase timeout to 30 seconds for getCurrentUser
        const { data: { user: authUser }, error } = await withTimeout(
          auth.getCurrentUser(),
          30000,
          'getCurrentUser'
        );
        
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
            await withTimeout(auth.signOut(), 10000, 'signOut');
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
      // Increase timeout to 30 seconds for database operations
      const { data, error } = await withTimeout(
        db.getUserById(userId),
        30000,
        'getUserById'
      );
      
      if (error) {
        console.error('❌ Error loading user profile:', error);
        // Don't throw here, just log and continue
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
        const { data: newProfile, error: createError } = await withTimeout(
          db.createUserProfile(userId, userData),
          30000,
          'createUserProfile'
        );
        
        if (!createError && newProfile) {
          console.log('✅ User profile created successfully');
          setUserProfile(newProfile);
        } else {
          console.error('❌ Error creating user profile:', createError);
        }
      }
    } catch (error) {
      console.error('❌ Error in loadUserProfile (possibly timeout):', error);
      // If profile loading fails, don't block the auth flow
      // Set a minimal profile or leave it null
      if (error.message.includes('timeout')) {
        console.log('⏰ Profile loading timed out, continuing without profile');
        setUserProfile(null);
      }
    }
  };

  const signIn = async (email, password) => {
    console.log('🔐 Signing in user:', email);
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        auth.signIn(email, password),
        10000,
        'signIn'
      );
      console.log('🔐 Sign in result:', { hasData: !!data, hasError: !!error });
      return { data, error };
    } catch (error) {
      console.error('❌ Sign in timeout or error:', error);
      return { data: null, error: error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, userData) => {
    console.log('📝 Signing up user:', email);
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        auth.signUp(email, password, userData),
        10000,
        'signUp'
      );
      console.log('📝 Sign up result:', { hasData: !!data, hasError: !!error });
      return { data, error };
    } catch (error) {
      console.error('❌ Sign up timeout or error:', error);
      return { data: null, error: error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out user');
    setLoading(true);
    try {
      const { error } = await withTimeout(
        auth.signOut(),
        5000,
        'signOut'
      );
      console.log('🚪 Sign out result:', { hasError: !!error });
      return { error };
    } catch (error) {
      console.error('❌ Sign out timeout or error:', error);
      return { error: error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user logged in' };
    
    console.log('📝 Updating profile for:', user.id);
    try {
      const { data, error } = await withTimeout(
        db.updateUser(user.id, updates),
        30000,
        'updateUser'
      );
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
      const { data, error } = await withTimeout(
        db.promoteToAdmin(email),
        30000,
        'promoteToAdmin'
      );
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