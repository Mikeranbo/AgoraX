import { describe, expect, it } from 'vitest';
import { countersToFix } from './recount';

const ev = (id: string, participantsCount: number, organiserInterest = 0, joins = participantsCount) => ({
  id,
  title: id,
  participantsCount,
  joins,
  organiserInterest,
});

describe('countersToFix', () => {
  it('leaves events whose counters match their sign-ups alone', () => {
    const fixes = countersToFix([ev('a', 2, 1)], [{ eventId: 'a' }, { eventId: 'a' }], [{ eventId: 'a' }]);
    expect(fixes).toEqual([]);
  });

  it('corrects a count inflated by join/leave loops back to the real participants', () => {
    const fixes = countersToFix([ev('a', 7)], [{ eventId: 'a' }], []);
    expect(fixes).toEqual([{ id: 'a', title: 'a', participantsCount: 1, organiserInterest: 0 }]);
  });

  it('corrects organiser interest from helper documents', () => {
    const fixes = countersToFix([ev('a', 0, 6)], [], [{ eventId: 'a' }, { eventId: 'a' }]);
    expect(fixes).toEqual([{ id: 'a', title: 'a', participantsCount: 0, organiserInterest: 2 }]);
  });

  it('flags joins that drifted from participantsCount', () => {
    const fixes = countersToFix([ev('a', 1, 0, 4)], [{ eventId: 'a' }], []);
    expect(fixes).toEqual([{ id: 'a', title: 'a', participantsCount: 1, organiserInterest: 0 }]);
  });

  it('raises a counter that drifted below its sign-ups', () => {
    const fixes = countersToFix([ev('a', 0)], [{ eventId: 'a' }, { eventId: 'a' }], []);
    expect(fixes[0].participantsCount).toBe(2);
  });

  it('ignores sign-ups left behind by deleted events', () => {
    const fixes = countersToFix([ev('a', 0)], [{ eventId: 'gone' }], [{ eventId: 'gone' }]);
    expect(fixes).toEqual([]);
  });

  it('treats missing counters on older events as 0', () => {
    const fixes = countersToFix([{ id: 'a', title: 'a', participantsCount: 0 }], [], []);
    expect(fixes).toEqual([]);
  });
});
