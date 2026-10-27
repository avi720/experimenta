import type { Database } from './database';

type Tables = Database['public']['Tables'];

export type TableName = keyof Tables;
export type Row<T extends TableName> = Tables[T]['Row'];
export type InsertRow<T extends TableName> = Tables[T]['Insert'];
export type UpdateRow<T extends TableName> = Tables[T]['Update'];

export type ExperimentTemplate = Row<'experiment_templates'>;
export type ExperimentRun = Row<'experiment_runs'>;
export type AppSettingsRow = Row<'app_settings'>;
export type Profile = Row<'profiles'>;

/** The signed-in user as the app sees it: auth identity merged with the profile row. */
export type AppUser = Partial<Profile> & {
  id: string;
  email?: string | null;
  role: string;
  subscription_tier: string;
};

/** Minimal settings shape the app relies on, also used as the fallback when none are stored. */
export type AppSettings = Pick<AppSettingsRow, 'virtual_lab_enabled' | 'locale_default'> & Partial<AppSettingsRow>;
