import type { AppUser, ExperimentTemplate } from '@/types/models';

// Experiment access tiers (experiment_templates.access_level in the baseline migration).
// public: everyone, registered: any signed-in user, premium: subscribers and admins.
export function canAccessExperiment(
  user: Pick<AppUser, 'role' | 'subscription_tier'> | null | undefined,
  experiment: Pick<ExperimentTemplate, 'access_level'> | null | undefined
): boolean {
  const level = experiment?.access_level ?? 'public';
  if (level === 'public') return true;
  if (!user) return false;
  if (level === 'registered') return true;
  return user.role === 'admin' || user.subscription_tier === 'premium';
}
