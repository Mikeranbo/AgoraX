import { describe, expect, it } from 'vitest';
import { closesLabel } from './dates';

const now = new Date('2026-10-21T12:00:00');

describe('closesLabel', () => {
  it('shows the closing day, not a countdown (APP_CHANGES §4)', () => {
    expect(closesLabel('2026-11-10T12:00:00', now)).toBe('Closes 10 Nov');
  });

  it('uses a fixed month name — en-GB would print "Sept"', () => {
    expect(closesLabel('2027-09-05T12:00:00', now)).toBe('Closes 5 Sep');
  });

  it('says Closed once the deadline has passed', () => {
    expect(closesLabel('2026-10-20T12:00:00', now)).toBe('Closed');
  });

  it('shows nothing for a missing or broken deadline, never "Invalid Date"', () => {
    expect(closesLabel(undefined, now)).toBe('');
    expect(closesLabel('', now)).toBe('');
    expect(closesLabel('not a date', now)).toBe('');
  });
});
