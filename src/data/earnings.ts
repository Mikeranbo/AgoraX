import { organiserEarnings } from './seedEvents';
import type { Event } from '../types';

/** organiserEarnings() for a Firestore event, whose cost fields are optional. */
export function earningsFor(e: Event) {
  return organiserEarnings({
    price: e.price,
    minParticipants: e.minParticipants,
    fixedCost: e.fixedCost ?? 0,
    perPersonCost: e.perPersonCost ?? 0,
    hostsNeeded: e.hostsNeeded ?? 1,
  });
}

/** Only events that carry organiser data (seed / admin-created) get the "help run this" offer. */
export function canOfferHosting(e: Event): boolean {
  return typeof e.hostsNeeded === 'number';
}

/** Whole euros for headline figures ("keep ~€14"). */
export function keepPerHost(e: Event): number {
  return Math.round(earningsFor(e).perHost);
}

/** €12 or €12.60 — cents only when there are some. */
export function eur(n: number): string {
  return Number.isInteger(n) ? `€${n}` : `€${n.toFixed(2)}`;
}

export function formatDuration(hours?: number): string {
  if (!hours) return '';
  if (hours >= 24) {
    const days = hours / 24;
    return `${Number.isInteger(days) ? days : days.toFixed(1)} day${days === 1 ? '' : 's'}`;
  }
  return `${hours} h`;
}
