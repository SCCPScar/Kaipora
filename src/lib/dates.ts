import { t } from '../i18n';
import type { Weekday } from './types';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const WEEKDAY_TO_DAYKEY: Record<Weekday, string> = { dom: 'sun', seg: 'mon', ter: 'tue', qua: 'wed', qui: 'thu', sex: 'fri', sab: 'sat' };

/** Full weekday names, Sunday-first (index matches Date#getDay()) — localized. */
export function dayNames(): string[] {
  return DAY_KEYS.map((k) => t(`dates.dayName.${k}`));
}

/** 3-letter weekday abbreviations, Sunday-first — localized. */
export function dayAbbr(): string[] {
  return DAY_KEYS.map((k) => t(`dates.dayAbbr.${k}`));
}

/** Full month names, January-first — localized. */
export function monthNames(): string[] {
  return MONTH_KEYS.map((k) => t(`dates.month.${k}`));
}

/** Full weekday name for a Rotina/Weekday code ('seg', 'ter', ...) — localized. */
export function weekdayName(w: Weekday): string {
  return t(`dates.dayName.${WEEKDAY_TO_DAYKEY[w]}`);
}

export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().split('T')[0];
}

export function fromISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfWeek(d: Date = new Date()): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - out.getDay());
  return out;
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function formatLong(d: Date = new Date()): string {
  return t('dates.formatLong', { day: dayNames()[d.getDay()], date: d.getDate(), month: monthNames()[d.getMonth()] });
}

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 12) return t('dates.greeting.morning');
  if (h < 20) return t('dates.greeting.afternoon');
  return t('dates.greeting.evening');
}

/** Sun=0 .. Sat=6 -> our dataset key order seg,ter,qua,qui,sex,sab,dom */
export const WEEKDAY_KEYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
