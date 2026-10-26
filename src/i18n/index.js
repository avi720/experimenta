import { useContext, useMemo, useCallback } from 'react';
import { AuthContext, readStoredGuestLocale } from '@/lib/AuthContext';
import he from './he';
import en from './en';

export const dictionaries = { he, en };

const LOCALE_TO_BOOL = {
  he: true,
  en: false,
};

/**
 * Resolves a locale code ('he' | 'en') from an explicit argument (`'he'`, `'en'`, or boolean `isRTL`),
 * falling back to `<html lang>` or stored guest locale, and defaulting to `'he'`.
 */
export function resolveLocale(localeOrIsRTL) {
  if (localeOrIsRTL === 'en' || localeOrIsRTL === false) return 'en';
  if (localeOrIsRTL === 'he' || localeOrIsRTL === true) return 'he';

  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement?.lang;
    if (htmlLang === 'en') return 'en';
    if (htmlLang === 'he') return 'he';
    if (document.documentElement?.dir === 'ltr') return 'en';
  }

  const stored = readStoredGuestLocale();
  if (stored === 'en' || stored === 'he') return stored;

  return 'he';
}

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  return String(path)
    .split('.')
    .reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), obj);
}

function interpolate(template, vars) {
  if (typeof template !== 'string' || !vars || typeof vars !== 'object') {
    return template;
  }
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : ''
  );
}

/**
 * Translates a dotted key (e.g. `'header.openMenu'`) for the given locale or `isRTL` boolean.
 * Supports `{{variable}}` interpolation and returns arrays/objects when the dictionary entry is structured.
 */
export function translate(localeOrIsRTL, key, vars) {
  const locale = resolveLocale(localeOrIsRTL);
  const primary = getNestedValue(dictionaries[locale], key);
  const raw = primary !== undefined ? primary : getNestedValue(dictionaries.he, key);
  if (raw === undefined) return key;
  return interpolate(raw, vars);
}

/**
 * Picks the localized value from a bilingual database/config object:
 * - `{ he, en }` (e.g., `experiment.i18n_texts`, `parameter.i18n_labels`, `categoryNames[cat]`)
 * - `{ name_he, name_en }` (e.g., `preset`, `physicsFormula`)
 * - `{ label_he, label_en }` (e.g., `parameter.options[i]`)
 * - `{ title_he, title_en }`
 */
export function pickLocalized(source, localeOrIsRTL, fallback = '') {
  if (!source || typeof source !== 'object') return fallback;
  const locale = resolveLocale(localeOrIsRTL);
  const altLocale = locale === 'he' ? 'en' : 'he';

  if (locale in source || altLocale in source) {
    return source[locale] || source[altLocale] || fallback;
  }
  const nameKey = `name_${locale}`;
  const altNameKey = `name_${altLocale}`;
  if (nameKey in source || altNameKey in source) {
    return source[nameKey] || source[altNameKey] || fallback;
  }
  const labelKey = `label_${locale}`;
  const altLabelKey = `label_${altLocale}`;
  if (labelKey in source || altLabelKey in source) {
    return source[labelKey] || source[altLabelKey] || fallback;
  }
  const titleKey = `title_${locale}`;
  const altTitleKey = `title_${altLocale}`;
  if (titleKey in source || altTitleKey in source) {
    return source[titleKey] || source[altTitleKey] || fallback;
  }
  return fallback;
}

/**
 * React hook returning `{ t, pick, locale, dir, isRTL, oppositeLocale, alignStart, alignEnd }`
 * synchronized with the active user/guest locale in `AuthContext` (or an optional override).
 */
export function useTranslation(overrideLocaleOrIsRTL) {
  const auth = useContext(AuthContext);

  const locale = useMemo(() => {
    if (overrideLocaleOrIsRTL !== undefined && overrideLocaleOrIsRTL !== null) {
      return resolveLocale(overrideLocaleOrIsRTL);
    }
    const fromAuth = auth?.user?.locale_preference || auth?.guestLocale;
    if (fromAuth === 'he' || fromAuth === 'en') {
      return fromAuth;
    }
    return resolveLocale();
  }, [overrideLocaleOrIsRTL, auth?.user?.locale_preference, auth?.guestLocale]);

  const isRTL = LOCALE_TO_BOOL[locale];
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  const oppositeLocale = locale === 'he' ? 'en' : 'he';
  const alignStart = locale === 'he' ? 'end' : 'start';
  const alignEnd = locale === 'he' ? 'start' : 'end';

  const t = useCallback(
    (key, vars) => translate(locale, key, vars),
    [locale]
  );

  const pick = useCallback(
    (source, fallback = '') => pickLocalized(source, locale, fallback),
    [locale]
  );

  return {
    t,
    pick,
    locale,
    dir,
    isRTL,
    oppositeLocale,
    alignStart,
    alignEnd,
  };
}
