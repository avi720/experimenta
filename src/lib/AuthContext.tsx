import { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { User } from '@/entities/User';
import type { Locale } from '@/i18n';
import type { AppUser } from '@/types/models';
import type { ChildrenProps } from '@/types/props';

export type AuthError = { type: 'profile_load_failed'; message: string };

export type AuthContextValue = {
  session: Session | null;
  user: AppUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoadingAuth: boolean;
  authError: AuthError | null;
  isPasswordRecovery: boolean;
  guestLocale: Locale | null;
  setGuestLocale: (locale: Locale | null) => void;
  signIn: typeof User.signIn;
  signUp: typeof User.signUp;
  signInWithGoogle: typeof User.signInWithGoogle;
  logout: () => Promise<void>;
  navigateToLogin: () => void;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (updates: Record<string, unknown>) => Promise<AppUser>;
  refreshUser: () => Promise<void>;
};

type LocaleStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const AuthContext = createContext<AuthContextValue | null>(null);

export const GUEST_LOCALE_STORAGE_KEY = 'experimenta_guest_locale';

export function readStoredGuestLocale(storage: LocaleStorage | null = typeof window !== 'undefined' ? window.localStorage : null): Locale | null {
  try {
    const val = storage?.getItem(GUEST_LOCALE_STORAGE_KEY);
    return val === 'he' || val === 'en' ? val : null;
  } catch {
    return null;
  }
}

export function writeStoredGuestLocale(locale: string | null, storage: LocaleStorage | null = typeof window !== 'undefined' ? window.localStorage : null) {
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
const userFromSession = (session: Session): AppUser => ({
  id: session.user.id,
  email: session.user.email,
  role: 'user',
  subscription_tier: 'free',
});

export const AuthProvider = ({ children }: ChildrenProps) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  // Persist guest language preference in localStorage (holds no personal data).
  const [guestLocale, setGuestLocaleState] = useState(() => readStoredGuestLocale());
  // Only the latest profile request may update state (sign-in/out can overlap).
  const profileRequestId = useRef(0);

  const setGuestLocale = useCallback((nextLocale: Locale | null) => {
    writeStoredGuestLocale(nextLocale);
    setGuestLocaleState(nextLocale);
  }, []);

  const loadProfile = useCallback(async (nextSession: Session | null) => {
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
      const message = error instanceof Error && error.message ? error.message : 'Failed to load user profile';
      setAuthError({ type: 'profile_load_failed', message });
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

  const signIn = useCallback<AuthContextValue['signIn']>((credentials) => User.signIn(credentials), []);
  const signUp = useCallback<AuthContextValue['signUp']>((details) => User.signUp(details), []);
  const signInWithGoogle = useCallback<AuthContextValue['signInWithGoogle']>((redirectPath) => User.signInWithGoogle(redirectPath), []);

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

  const updatePassword = useCallback(async (password: string) => {
    await User.updatePassword(password);
    setIsPasswordRecovery(false);
  }, []);

  const updateProfile = useCallback(async (updates: Record<string, unknown>) => {
    const updated = await User.updateMe(updates);
    setUser((prev) => (prev ? { ...prev, ...updated } : prev));
    return updated;
  }, []);

  const refreshUser = useCallback(() => loadProfile(session), [loadProfile, session]);

  const value = useMemo((): AuthContextValue => ({
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
