export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/Dashboard',
  LAB: '/Lab',
  LAB_WORKSPACE: '/LabWorkspace',
  RESULTS: '/Results',
  ADMIN_EXPERIMENTS: '/AdminExperiments',
  ADMIN_EXPERIMENT_FORM: '/AdminExperimentForm',
  ABOUT: '/AboutUs',
  WHAT_IS_NEW: '/WhatIsNew',
  PRIVACY: '/PrivacyPolicy',
  TERMS: '/TermsOfService',
  LOGIN: '/Login',
} as const;

export const FULL_SCREEN_PAGES: readonly string[] = [
  'LabWorkspace',
  'AdminExperimentForm',
  'FreeFallExperiment',
  'ShoExperiment',
  'QuantumTunnelingExperiment',
  'DoubleSlitExperiment',
];

export function getLabUrl(category?: string | null): string {
  return category ? `/Lab?category=${encodeURIComponent(category)}` : '/Lab';
}

export function getAdminExperimentFormUrl(id?: string | null): string {
  return id ? `/AdminExperimentForm?id=${encodeURIComponent(id)}` : '/AdminExperimentForm';
}

/**
 * Normalizes page names to route paths.
 * Retained for backwards compatibility across existing callers.
 */
export function createPageUrl(pageName: string): string {
  if (!pageName) return '/';
  if (pageName.startsWith('/')) return pageName;
  if (pageName === 'Dashboard') return '/';
  return '/' + pageName.replace(/ /g, '-');
}
