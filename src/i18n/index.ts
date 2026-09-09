import type { Locale } from '../lib/types';
import { getSettings, saveSettings } from '../lib/storage';
import { dict as ptBR } from './locales/pt-BR';
import { dict as ptPT } from './locales/pt-PT';
import { dict as es } from './locales/es';
import { dict as en } from './locales/en';
import { dict as fr } from './locales/fr';
import { dict as zh } from './locales/zh';

export type { Locale };

export const SUPPORTED_LOCALES: { code: Locale; label: string }[] = [
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'pt-PT', label: 'Português (Portugal)' },
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'zh', label: '中文' }
];

const DICTS: Record<Locale, Record<string, string>> = {
  'pt-BR': ptBR,
  'pt-PT': ptPT,
  es,
  en,
  fr,
  zh
};

/** In-memory current locale, initialized from the persisted setting so a
 * reload picks up the last choice (see src/lib/storage.ts / types.ts). */
let currentLocale: Locale = getSettings().language;

export function getLocale(): Locale {
  return currentLocale;
}

/** Switches the active locale and persists the choice through the existing
 * settings storage so it survives reload/export/import like every other
 * setting. Callers are responsible for re-rendering (see nav.ts refreshActive). */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
  saveSettings({ language: locale });
}

/**
 * Looks up `key` in the active locale's dictionary, falling back to pt-BR
 * (the app's default/fallback language) when the key is missing there —
 * never throws, never surfaces a raw key to the user. `{{param}}` tokens in
 * the resolved string are substituted from `params` when given.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = DICTS[currentLocale] ?? ptBR;
  const raw = dict[key] ?? ptBR[key] ?? key;
  if (!params) return raw;
  let out = raw;
  for (const [k, v] of Object.entries(params)) {
    out = out.split(`{{${k}}}`).join(String(v));
  }
  return out;
}
