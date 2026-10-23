import { describe, expect, it } from 'vitest';
import { daysFrom, formatEventDate, isScheduled, matchesDate } from './schedule';

const confirmed = (startTime: string, extra = {}) => ({ status: 'Confirmed' as const, dateConfirmed: true, startTime, ...extra });

describe('isScheduled', () => {
  it('only counts confirmed events with a confirmed real date', () => {
    expect(isScheduled(confirmed('2026-11-14T18:30:00Z'))).toBe(true);
    expect(isScheduled(confirmed('2026-11-14T18:30:00Z', { status: 'Pending' }))).toBe(false);
    expect(isScheduled(confirmed('2026-11-14T18:30:00Z', { dateConfirmed: false }))).toBe(false);
    expect(isScheduled({ status: 'Confirmed', startTime: '2026-11-14T18:30:00Z' })).toBe(false);
    expect(isScheduled(confirmed('not a date'))).toBe(false);
    expect(isScheduled({ status: 'Confirmed', dateConfirmed: true })).toBe(false);
  });
});

describe('daysFrom in Europe/Amsterdam', () => {
  it('uses the Amsterdam calendar day, not UTC', () => {
    // 23:30 UTC on 13 Nov is already 00:30 on 14 Nov in Amsterdam (CET, UTC+1).
    const now = new Date('2026-11-13T23:30:00Z');
    expect(daysFrom(now, new Date('2026-11-14T10:00:00Z'))).toBe(0);
    expect(daysFrom(now, new Date('2026-11-15T10:00:00Z'))).toBe(1);
  });

  it('handles the night the clocks go back (25 Oct 2026)', () => {
    const now = new Date('2026-10-24T22:30:00Z'); // 00:30 CEST on 25 Oct
    expect(daysFrom(now, new Date('2026-10-25T22:30:00Z'))).toBe(0); // 23:30 CET, still 25 Oct
    expect(daysFrom(now, new Date('2026-10-25T23:30:00Z'))).toBe(1); // 00:30 on 26 Oct
  });
});

describe('matchesDate', () => {
  const now = new Date('2026-11-13T09:00:00Z');
  it('never treats a proposal as happening today', () => {
    expect(matchesDate({ status: 'Pending', startTime: '2026-11-13T18:00:00Z' }, 'today', now)).toBe(false);
    expect(matchesDate({ status: 'Pending', startTime: '2026-11-13T18:00:00Z' }, 'any', now)).toBe(false);
  });

  it('filters scheduled events by today, tomorrow and the coming week', () => {
    const today = confirmed('2026-11-13T18:00:00Z');
    const tomorrow = confirmed('2026-11-14T18:00:00Z');
    const nextWeek = confirmed('2026-11-25T18:00:00Z');
    const past = confirmed('2026-11-10T18:00:00Z');
    expect([today, tomorrow, nextWeek, past].map((e) => matchesDate(e, 'today', now))).toEqual([true, false, false, false]);
    expect([today, tomorrow, nextWeek, past].map((e) => matchesDate(e, 'tomorrow', now))).toEqual([false, true, false, false]);
    expect([today, tomorrow, nextWeek, past].map((e) => matchesDate(e, 'week', now))).toEqual([true, true, false, false]);
    expect([today, tomorrow, nextWeek, past].map((e) => matchesDate(e, 'any', now))).toEqual([true, true, true, false]);
  });
});

describe('formatEventDate', () => {
  it('shows Amsterdam local time with its zone', () => {
    expect(formatEventDate('2026-11-14T18:30:00Z')).toBe('Sat 14 Nov, 19:30 CET');
    expect(formatEventDate('2026-07-04T18:30:00Z')).toBe('Sat 4 Jul, 20:30 CEST');
    expect(formatEventDate('2026-09-05T08:00:00Z')).toBe('Sat 5 Sep, 10:00 CEST');
  });

  it('returns nothing for missing or broken dates', () => {
    expect(formatEventDate(undefined)).toBe('');
    expect(formatEventDate('soon')).toBe('');
  });
});
