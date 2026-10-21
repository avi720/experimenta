import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/api/supabaseClient';
import { User } from '@/entities/User';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  // Guests never persist anything, so their language choice lives in memory only.
  const [guestLocale, setGuestLocale] = useState(null);

  const loadProfile = useCallback(async (nextSession) => {
    if (!nextSession?.user) {
      setUser(null);
      return;
    }
    try {
      setUser(await User.me());
      setAuthError(null);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setUser(null);
      setAuthError({ type: 'profile_load_failed', message: error.message });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      await loadProfile(initialSession);
      if (isMounted) setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      // Supabase advises against awaiting other supabase calls inside this callback.
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'SIGNED_OUT') {
        setTimeout(() => loadProfile(nextSession), 0);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback((credentials) => User.signIn(credentials), []);
  const signUp = useCallback((details) => User.signUp(details), []);

  const logout = useCallback(async () => {
    await User.logout();
    setUser(null);
    setSession(null);
  }, []);

  const navigateToLogin = useCallback(() => {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.assign(`/Login?redirect=${redirect}`);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const updated = await User.updateMe(updates);
    setUser((prev) => (prev ? { ...prev, ...updated } : prev));
    return updated;
  }, []);

  const refreshUser = useCallback(() => loadProfile(session), [loadProfile, session]);

  const value = useMemo(() => ({
    session,
    user,
    isAuthenticated: !!session?.user,
    isAdmin: user?.role === 'admin',
    isLoadingAuth,
    authError,
    guestLocale,
    setGuestLocale,
    signIn,
    signUp,
    logout,
    navigateToLogin,
    updateProfile,
    refreshUser,
  }), [session, user, isLoadingAuth, authError, guestLocale, signIn, signUp, logout, navigateToLogin, updateProfile, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
