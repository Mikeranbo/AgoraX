import type { Event } from '../types';

type Counts = Pick<Event, 'minParticipants' | 'participantsCount'>;

/** People still needed to reach the interest target (never negative). */
export function remaining(e: Counts): number {
  return Math.max(0, (e.minParticipants || 0) - (e.participantsCount || 0));
}

/**
 * Enough people said they're interested. This is a signal, not a promise: an event still needs
 * a host, a venue and a date, and an admin confirms it by hand.
 */
export function targetReached(e: Counts): boolean {
  return e.minParticipants > 0 && (e.participantsCount || 0) >= e.minParticipants;
}

/** Confirmed by an admin in /admin. The only state the app calls "confirmed". */
export function isConfirmed(e: Pick<Event, 'status'>): boolean {
  return e.status === 'Confirmed';
}

export function progressPercent(e: Counts): number {
  if (!e.minParticipants) return 0;
  return Math.min(100, Math.round(((e.participantsCount || 0) / e.minParticipants) * 100));
}

/** "8 of 12 interested · 4 more to reach the target", for screen readers and summaries. */
export function progressLabel(e: Counts & Pick<Event, 'status'>): string {
  const count = Math.max(0, e.participantsCount || 0);
  if (isConfirmed(e)) return `Confirmed · ${count} interested`;
  if (targetReached(e)) return `${count} of ${e.minParticipants} interested · target reached, not confirmed yet`;
  return `${count} of ${e.minParticipants} interested · ${remaining(e)} more to reach the target`;
}
