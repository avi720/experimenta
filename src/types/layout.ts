import type { Location } from 'react-router-dom';
import type { Locale } from '@/i18n';
import type { AppSettings, AppUser, ExperimentTemplate } from './models';
import type { IsRTLProps } from './props';

/** Signed-in user as shown in the site header (null for guests). */
export type HeaderUserProps = { user: AppUser | null };

/** Router location the header uses to highlight the active link. */
export type HeaderLocationProps = { location: Location };

/** Active experiment templates listed in the header's experiments menu. */
export type HeaderExperimentsProps = { experiments: ExperimentTemplate[] };

/** Header actions provided by `useAppData()`. */
export type HeaderActionsProps = {
  handleLogout: () => void | Promise<void>;
  handleLanguageChange: (locale: Locale) => void | Promise<void>;
};

/** Props of the site header, as passed by `Layout`. */
export type AppHeaderProps = IsRTLProps &
  HeaderUserProps &
  HeaderLocationProps &
  HeaderExperimentsProps &
  HeaderActionsProps & {
    settings: AppSettings | null;
  };
