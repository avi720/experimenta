import { LEGACY_EXPERIMENT_PAGE_SLUGS } from '@/simulation/experimentRegistry';

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

// Legacy experiment page names come from the registry, so a new experiment needs no edit here.
export const LEGACY_EXPERIMENT_PAGES: readonly string[] = Object.keys(LEGACY_EXPERIMENT_PAGE_SLUGS);

export const FULL_SCREEN_PAGES: readonly string[] = [
  'LabWorkspace',
  'AdminExperimentForm',
  ...LEGACY_EXPERIMENT_PAGES,
];

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
