import type { ThemePreference } from './types';

/**
 * 'system' means no explicit choice — the `@media (prefers-color-scheme)`
 * block in style.css takes over, so we simply remove the attribute rather
 * than trying to resolve the OS preference ourselves.
 */
export function applyTheme(pref: ThemePreference): void {
  const root = document.documentElement;
  if (pref === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);
}
