import { describe, it, expect } from 'vitest';
import he from './he';
import en from './en';
import { translate, pickLocalized, resolveLocale } from './index';
import { queryClientInstance, appQueryKeys } from '@/lib/query-client';

function collectKeys(obj: object, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

describe('i18n dictionaries and helpers (T41, T42)', () => {
  it('maintains 100% key parity between Hebrew and English dictionaries', () => {
    const heKeys = collectKeys(he).sort();
    const enKeys = collectKeys(en).sort();
    expect(enKeys).toEqual(heKeys);
  });

  it('resolves locale from strings and booleans', () => {
    expect(resolveLocale('he')).toBe('he');
    expect(resolveLocale('en')).toBe('en');
    expect(resolveLocale(true)).toBe('he');
    expect(resolveLocale(false)).toBe('en');
  });

  it('interpolates template variables in both languages', () => {
    expect(translate('he', 'workspace.validation.minBound', { min: 5 })).toBe('הערך חייב להיות לפחות 5');
    expect(translate('en', 'workspace.validation.minBound', { min: 5 })).toBe('Value must be at least 5');
  });

  it('picks localized fields across object shapes', () => {
    expect(pickLocalized({ he: 'נפילה חופשית', en: 'Free Fall' }, 'he')).toBe('נפילה חופשית');
    expect(pickLocalized({ he: 'נפילה חופשית', en: 'Free Fall' }, 'en')).toBe('Free Fall');
    expect(pickLocalized({ name_he: 'תבנית א', name_en: 'Preset A' }, 'en')).toBe('Preset A');
    expect(pickLocalized({ label_he: 'אפשרות', label_en: 'Option' }, 'he')).toBe('אפשרות');
    expect(pickLocalized(null, 'en', 'fallback')).toBe('fallback');
  });

  it('resolves fallback locale from cached queryClient app-settings on cold navigation', () => {
    queryClientInstance.setQueryData(appQueryKeys.settings, { locale_default: 'en' });
    try {
      expect(resolveLocale()).toBe('en');
    } finally {
      queryClientInstance.removeQueries({ queryKey: appQueryKeys.settings });
    }
  });
});
