import { createContext, useContext, useMemo, useCallback, useEffect, createElement, type ReactNode } from 'react';
import { AuthContext, readStoredGuestLocale } from '@/lib/AuthContext';
import { useAppSettingsQuery } from '@/hooks/useDataQueries';
import { appQueryKeys, queryClientInstance } from '@/lib/query-client';
import type { AppSettings } from '@/types/models';
import he from './he';
import en from './en';

export type Locale = 'he' | 'en';
/** A locale code, or the legacy `isRTL` boolean (true = Hebrew). Empty means resolve from context. */
export type LocaleInput = Locale | boolean | null | undefined;
type Vars = Record<string, unknown>;
type Dir = 'rtl' | 'ltr';

export const dictionaries: Record<Locale, Record<string, unknown>> = { he, en };

const LOCALE_TO_BOOL: Record<Locale, boolean> = {
  he: true,
  en: false,
};

type I18nContextValue = { locale: Locale; isRTL: boolean; dir: Dir };
type AuthLocaleSource = { user?: { locale_preference?: string | null } | null; guestLocale?: string | null } | null | undefined;

export const I18nContext = createContext<I18nContextValue | null>(null);

const isLocale = (value: unknown): value is Locale => value === 'he' || value === 'en';

/**
 * Resolves a locale code ('he' | 'en') from an explicit argument (`'he'`, `'en'`, or boolean `isRTL`),
 * falling back to stored guest locale, cached app settings, `<html lang>`, and defaulting to `'he'`.
 */
export function resolveLocale(localeOrIsRTL?: LocaleInput): Locale {
  if (localeOrIsRTL === 'en' || localeOrIsRTL === false) return 'en';
  if (localeOrIsRTL === 'he' || localeOrIsRTL === true) return 'he';

  const stored = readStoredGuestLocale();
  if (isLocale(stored)) return stored;

  const cachedSettings = queryClientInstance.getQueryData<AppSettings>(appQueryKeys.settings);
  if (isLocale(cachedSettings?.locale_default)) {
    return cachedSettings.locale_default;
  }

  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement?.lang;
    if (htmlLang === 'en') return 'en';
    if (htmlLang === 'he') return 'he';
    if (document.documentElement?.dir === 'ltr') return 'en';
  }

  return 'he';
}

function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || !path) return undefined;
  return String(path)
    .split('.')
    .reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), obj);
}

function interpolate(template: unknown, vars?: Vars): unknown {
  if (typeof template !== 'string' || !vars || typeof vars !== 'object') {
    return template;
  }
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) =>
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : ''
  );
}

/**
 * Translates a dotted key (e.g. `'header.openMenu'`) for the given locale or `isRTL` boolean.
 * Supports `{{variable}}` interpolation and returns arrays/objects when the dictionary entry is structured.
 */
// The return type defaults to string; structured entries (e.g. step lists) can be requested as T.
export function translate<T = string>(localeOrIsRTL: LocaleInput, key: string, vars?: Vars): T {
  const locale = resolveLocale(localeOrIsRTL);
  const primary = getNestedValue(dictionaries[locale], key);
  const raw = primary !== undefined ? primary : getNestedValue(dictionaries.he, key);
  if (raw === undefined) return key as T;
  return interpolate(raw, vars) as T;
}

/**
 * Picks the localized value from a bilingual database/config object:
 * - `{ he, en }` (e.g., `experiment.i18n_texts`, `parameter.i18n_labels`, `categoryNames[cat]`)
 * - `{ name_he, name_en }` (e.g., `preset`, `physicsFormula`)
 * - `{ label_he, label_en }` (e.g., `parameter.options[i]`)
 * - `{ title_he, title_en }`
 */
export function pickLocalized<T = string>(source: unknown, localeOrIsRTL: LocaleInput, fallback: T | '' = ''): T {
  if (!source || typeof source !== 'object') return fallback as T;
  const record = source as Record<string, T | undefined>;
  const locale = resolveLocale(localeOrIsRTL);
  const altLocale = locale === 'he' ? 'en' : 'he';

  if (locale in record || altLocale in record) {
    return record[locale] || record[altLocale] || (fallback as T);
  }
  const nameKey = `name_${locale}`;
  const altNameKey = `name_${altLocale}`;
  if (nameKey in record || altNameKey in record) {
    return record[nameKey] || record[altNameKey] || (fallback as T);
  }
  const labelKey = `label_${locale}`;
  const altLabelKey = `label_${altLocale}`;
  if (labelKey in record || altLabelKey in record) {
    return record[labelKey] || record[altLabelKey] || (fallback as T);
  }
  const titleKey = `title_${locale}`;
  const altTitleKey = `title_${altLocale}`;
  if (titleKey in record || altTitleKey in record) {
    return record[titleKey] || record[altTitleKey] || (fallback as T);
  }
  return fallback as T;
}

/**
 * App-wide i18n provider syncing locale with user preference, guest storage,
 * and app_settings.locale_default. It is the single owner of <html lang/dir>, which
 * portaled UI (dropdowns, dialogs, toasts) inherits its direction from.
 */
export function I18nProvider({ children }: { children?: ReactNode }) {
  const auth = useContext(AuthContext) as AuthLocaleSource;

  const settingsQuery = useAppSettingsQuery();

  const locale = useMemo(() => {
    const fromAuth = auth?.user?.locale_preference || auth?.guestLocale;
    if (isLocale(fromAuth)) {
      return fromAuth;
    }
    const fromSettings = settingsQuery?.data?.locale_default;
    if (isLocale(fromSettings)) {
      return fromSettings;
    }
    const stored = readStoredGuestLocale();
    if (isLocale(stored)) {
      return stored;
    }
    return 'he' as const;
  }, [auth?.user?.locale_preference, auth?.guestLocale, settingsQuery?.data?.locale_default]);

  const isRTL = LOCALE_TO_BOOL[locale] ?? true;
  const dir: Dir = isRTL ? 'rtl' : 'ltr';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
    }
  }, [locale, dir]);

  const value = useMemo(() => ({ locale, isRTL, dir }), [locale, isRTL, dir]);

  return createElement(I18nContext.Provider, { value }, children);
}

/**
 * React hook returning `{ t, pick, locale, dir, isRTL, oppositeLocale, menuAlignStart, menuAlignEnd }`
 * synchronized with active I18nProvider, AuthContext, or an optional override.
 */
export function useTranslation(overrideLocaleOrIsRTL?: LocaleInput) {
  const i18n = useContext(I18nContext);
  const auth = useContext(AuthContext) as AuthLocaleSource;

  const locale = useMemo((): Locale => {
    if (overrideLocaleOrIsRTL !== undefined && overrideLocaleOrIsRTL !== null) {
      return resolveLocale(overrideLocaleOrIsRTL);
    }
    if (i18n?.locale) {
      return i18n.locale;
    }
    const fromAuth = auth?.user?.locale_preference || auth?.guestLocale;
    if (isLocale(fromAuth)) {
      return fromAuth;
    }
    return resolveLocale();
  }, [overrideLocaleOrIsRTL, i18n?.locale, auth?.user?.locale_preference, auth?.guestLocale]);

  const isRTL = LOCALE_TO_BOOL[locale] ?? true;
  const dir: Dir = isRTL ? 'rtl' : 'ltr';
  const oppositeLocale: Locale = locale === 'he' ? 'en' : 'he';

  // Radix UI dropdown alignment: In LTR, 'start' aligns with the trigger's left edge.
  // In RTL, logical start is the physical right edge, corresponding to Radix align="end".
  const menuAlignStart: 'start' | 'end' = locale === 'he' ? 'end' : 'start';
  const menuAlignEnd: 'start' | 'end' = locale === 'he' ? 'start' : 'end';

  const t = useCallback(
    <T = string>(key: string, vars?: Vars) => translate<T>(locale, key, vars),
    [locale]
  );

  const pick = useCallback(
    <T = string>(source: unknown, fallback: T | '' = '') => pickLocalized<T>(source, locale, fallback),
    [locale]
  );

  return {
    t,
    pick,
    locale,
    dir,
    isRTL,
    oppositeLocale,
    menuAlignStart,
    menuAlignEnd,
    // Aliases for backwards compatibility:
    alignStart: menuAlignStart,
    alignEnd: menuAlignEnd,
  };
}
