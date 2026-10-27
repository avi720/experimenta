import type { User as AuthUser } from '@supabase/supabase-js';
import { supabase } from '@/api/supabaseClient';
import type { AppUser, UpdateRow } from '@/types/models';

type EditableProfile = Pick<UpdateRow<'profiles'>, 'full_name' | 'locale_preference'>;

export class AuthRequiredError extends Error {
  status = 401;
  constructor() {
    super('Not authenticated');
  }
}

// Profile fields a user may change themselves (role / subscription_tier are protected in the DB).
const EDITABLE_PROFILE_FIELDS: ReadonlyArray<keyof EditableProfile> = ['full_name', 'locale_preference'];

const fetchProfile = async (authUser: AuthUser): Promise<AppUser> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();
  if (error) throw error;
  return {
    ...data,
    id: authUser.id,
    email: authUser.email,
    role: data?.role ?? 'user',
    subscription_tier: data?.subscription_tier ?? 'free',
  };
};

export const User = {
  /** Returns the signed-in user merged with their profile, or throws if signed out. */
  async me(): Promise<AppUser> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      throw new AuthRequiredError();
    }
    return fetchProfile(data.user);
  },

  async updateMe(updates: Record<string, unknown>): Promise<AppUser> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const allowed = Object.fromEntries(
      Object.entries(updates).filter(([key]) => (EDITABLE_PROFILE_FIELDS as readonly string[]).includes(key))
    ) as EditableProfile;
    const { data, error } = await supabase
      .from('profiles')
      .update(allowed)
      .eq('id', user.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Profile not found for the current user');
    return { ...data, email: user.email };
  },

  async signIn({ email, password }: { email: string; password: string }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp({ email, password, fullName }: { email: string; password: string; fullName?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || '' },
        emailRedirectTo: `${window.location.origin}/Login`,
      },
    });
    if (error) throw error;
    return data;
  },

  /** Redirects to Google; on return the session is picked up from the URL on /Login. */
  async signInWithGoogle(redirectPath = '/') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/Login?redirect=${encodeURIComponent(redirectPath)}`,
      },
    });
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/Login?mode=recovery`,
    });
    if (error) throw error;
  },

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
