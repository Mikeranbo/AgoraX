import { PILOT_TIME_ZONE } from '../config/pilot';
import type { Event } from '../types';

/**
 * Most of the pilot is proposals, which have no date. An event counts as scheduled only when an
 * admin has confirmed it *and* ticked "date confirmed" on a real start time. Older documents
 * carry placeholder deadline/startTime values written at seeding; those are kept in the data
 * but never shown.
 */
export function isScheduled(e: Pick<Event, 'status' | 'dateConfirmed' | 'startTime'>): boolean {
  return e.status === 'Confirmed' && e.dateConfirmed === true && !!e.startTime && !Number.isNaN(new Date(e.startTime).getTime());
}

/** "2026-10-25" for the calendar day `d` falls on in `timeZone`. */
export function dayKey(d: Date, timeZone = PILOT_TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** Whole calendar days from `now` to `then` in `timeZone`: 0 = same day, 1 = the next day. */
export function daysFrom(now: Date, then: Date, timeZone = PILOT_TIME_ZONE): number {
  const utc = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(dayKey(then, timeZone)) - utc(dayKey(now, timeZone))) / 86_400_000);
}

export type DateFilter = 'any' | 'today' | 'tomorrow' | 'week';

/** Scheduled events only; a proposal never matches a date filter. */
export function matchesDate(e: Pick<Event, 'status' | 'dateConfirmed' | 'startTime'>, filter: DateFilter, now: Date): boolean {
  if (!isScheduled(e)) return false;
  const days = daysFrom(now, new Date(e.startTime!));
  if (filter === 'today') return days === 0;
  if (filter === 'tomorrow') return days === 1;
  if (filter === 'week') return days >= 0 && days <= 6;
  return days >= 0;
}

/** "Sat 14 Nov, 19:30 CET" in the pilot time zone, or '' for no usable date. */
export function formatEventDate(iso: string | undefined, timeZone = PILOT_TIME_ZONE): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  // Older ICU builds spell September "Sept"; keep the 3-letter form everywhere.
  return `${get('weekday')} ${get('day')} ${get('month').slice(0, 3)}, ${get('hour')}:${get('minute')} ${get('timeZoneName')}`;
}
