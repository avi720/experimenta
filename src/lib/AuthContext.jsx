import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { User } from '@/entities/User';

export const AuthContext = createContext();

export const GUEST_LOCALE_STORAGE_KEY = 'experimenta_guest_locale';

export function readStoredGuestLocale(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  try {
    const val = storage?.getItem(GUEST_LOCALE_STORAGE_KEY);
    return val === 'he' || val === 'en' ? val : null;
  } catch {
    return null;
  }
}

export function writeStoredGuestLocale(locale, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  try {
    if (!storage) return;
    if (locale === 'he' || locale === 'en') {
      storage.setItem(GUEST_LOCALE_STORAGE_KEY, locale);
    } else {
      storage.removeItem(GUEST_LOCALE_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

// Minimal user built from the auth session, used if the profile row cannot be loaded.
const userFromSession = (session) => ({
  id: session.user.id,
  email: session.user.email,
  role: 'user',
  subscription_tier: 'free',
  locale_preference: null,
});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  // Persist guest language preference in localStorage (holds no personal data).
  const [guestLocale, setGuestLocaleState] = useState(() => readStoredGuestLocale());
  // Only the latest profile request may update state (sign-in/out can overlap).
  const profileRequestId = useRef(0);

  const setGuestLocale = useCallback((nextLocale) => {
    writeStoredGuestLocale(nextLocale);
    setGuestLocaleState(nextLocale);
  }, []);

  const loadProfile = useCallback(async (nextSession) => {
    const requestId = ++profileRequestId.current;
    if (!nextSession?.user) {
      setUser(null);
      setAuthError(null);
      return;
    }
    try {
      const profile = await User.me();
      if (requestId !== profileRequestId.current) return;
      setUser(profile);
      setAuthError(null);
    } catch (error) {
      if (requestId !== profileRequestId.current) return;
      console.error('Failed to load user profile:', error);
      setUser((prev) => prev?.id === nextSession.user.id ? prev : userFromSession(nextSession));
      setAuthError({ type: 'profile_load_failed', message: error.message || 'Failed to load user profile' });
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
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
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
  const signInWithGoogle = useCallback((redirectPath) => User.signInWithGoogle(redirectPath), []);

  const logout = useCallback(async () => {
    profileRequestId.current++;
    await User.logout();
    setUser(null);
    setSession(null);
    setAuthError(null);
  }, []);

  const navigateToLogin = useCallback(() => {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    navigate(`/Login?redirect=${redirect}`);
  }, [navigate]);

  const updatePassword = useCallback(async (password) => {
    await User.updatePassword(password);
    setIsPasswordRecovery(false);
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
    isPasswordRecovery,
    guestLocale,
    setGuestLocale,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    navigateToLogin,
    updatePassword,
    updateProfile,
    refreshUser,
  }), [session, user, isLoadingAuth, authError, isPasswordRecovery, guestLocale, setGuestLocale, signIn, signUp, signInWithGoogle, logout, navigateToLogin, updatePassword, updateProfile, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
