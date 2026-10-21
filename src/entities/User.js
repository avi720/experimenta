import { supabase } from '@/api/supabaseClient';

// Profile fields a user may change themselves (role / subscription_tier are protected in the DB).
const EDITABLE_PROFILE_FIELDS = ['full_name', 'locale_preference'];

const fetchProfile = async (authUser) => {
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
  async me() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      const authError = new Error('Not authenticated');
      authError.status = 401;
      throw authError;
    }
    return fetchProfile(data.user);
  },

  async updateMe(updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const allowed = Object.fromEntries(
      Object.entries(updates).filter(([key]) => EDITABLE_PROFILE_FIELDS.includes(key))
    );
    const { data, error } = await supabase
      .from('profiles')
      .update(allowed)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    return { ...data, email: user.email };
  },

  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp({ email, password, fullName }) {
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

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/Login`,
    });
    if (error) throw error;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
