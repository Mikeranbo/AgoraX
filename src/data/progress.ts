import type { Event } from '../types';

/** People still needed before the event runs (never negative). */
export function remaining(e: Pick<Event, 'minParticipants' | 'participantsCount'>): number {
  return Math.max(0, (e.minParticipants || 0) - (e.participantsCount || 0));
}

/** True once the target is met, or an admin has confirmed the event by hand. */
export function hasEnough(e: Pick<Event, 'minParticipants' | 'participantsCount' | 'status'>): boolean {
  return e.status === 'Confirmed' || (e.minParticipants > 0 && (e.participantsCount || 0) >= e.minParticipants);
}

export function progressPercent(e: Pick<Event, 'minParticipants' | 'participantsCount'>): number {
  if (!e.minParticipants) return 0;
  return Math.min(100, Math.round(((e.participantsCount || 0) / e.minParticipants) * 100));
}

/** "6 of 10 — 4 more and this runs" / "12 of 10 — enough people, this runs". */
export function progressLabel(e: Pick<Event, 'minParticipants' | 'participantsCount' | 'status'>): string {
  const count = Math.max(0, e.participantsCount || 0);
  if (hasEnough(e)) return `${count} of ${e.minParticipants} — enough people, this runs`;
  return `${count} of ${e.minParticipants} — ${remaining(e)} more and this runs`;
}
