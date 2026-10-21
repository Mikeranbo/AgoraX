import { describe, expect, it } from 'vitest';
import { hasEnough, progressLabel, progressPercent, remaining } from './progress';

const at = (participantsCount: number, status: 'Pending' | 'Confirmed' | 'Cancelled' = 'Pending') => ({
  minParticipants: 12,
  participantsCount,
  status,
});

describe('progress', () => {
  it('labels an event short of its minimum the way APP_CHANGES §4 shows it', () => {
    expect(progressLabel(at(8))).toBe('8 of 12 — 4 more and this runs');
    expect(remaining(at(8))).toBe(4);
    expect(hasEnough(at(8))).toBe(false);
  });

  it('counts the minimum as reached at exactly the minimum', () => {
    expect(hasEnough(at(12))).toBe(true);
    expect(remaining(at(12))).toBe(0);
  });

  it('never reports a negative remainder past the minimum', () => {
    expect(remaining(at(15))).toBe(0);
    expect(progressPercent(at(15))).toBe(100);
  });

  it('treats a manually confirmed event as running even at zero', () => {
    expect(hasEnough(at(0, 'Confirmed'))).toBe(true);
  });
});
