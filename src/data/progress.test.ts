import { describe, expect, it } from 'vitest';
import { isConfirmed, progressLabel, progressPercent, remaining, targetReached } from './progress';

const at = (participantsCount: number, status: 'Pending' | 'Confirmed' | 'Cancelled' = 'Pending') => ({
  minParticipants: 12,
  participantsCount,
  status,
});

describe('progress', () => {
  it('labels interest short of the target without promising the event', () => {
    expect(progressLabel(at(8))).toBe('8 of 12 interested · 4 more to reach the target');
    expect(remaining(at(8))).toBe(4);
    expect(targetReached(at(8))).toBe(false);
  });

  it('counts the target as reached at exactly the target, but not as confirmed', () => {
    expect(targetReached(at(12))).toBe(true);
    expect(isConfirmed(at(12))).toBe(false);
    expect(remaining(at(12))).toBe(0);
    expect(progressLabel(at(12))).toBe('12 of 12 interested · target reached, not confirmed yet');
  });

  it('never reports a negative remainder past the target', () => {
    expect(remaining(at(15))).toBe(0);
    expect(progressPercent(at(15))).toBe(100);
  });

  it('only calls an event confirmed when an admin has confirmed it', () => {
    expect(isConfirmed(at(0, 'Confirmed'))).toBe(true);
    expect(targetReached(at(0, 'Confirmed'))).toBe(false);
    expect(progressLabel(at(3, 'Confirmed'))).toBe('Confirmed · 3 interested');
  });
});
