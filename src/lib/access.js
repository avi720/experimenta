// Experiment access tiers (experiment_templates.access_level in schema.sql).
// public: everyone, registered: any signed-in user, premium: subscribers and admins.
export function canAccessExperiment(user, experiment) {
  const level = experiment?.access_level ?? 'public';
  if (level === 'public') return true;
  if (!user) return false;
  if (level === 'registered') return true;
  return user.role === 'admin' || user.subscription_tier === 'premium';
}
