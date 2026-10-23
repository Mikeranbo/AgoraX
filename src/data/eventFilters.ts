import type { Event, EventCategory } from '../types';
import { DateFilter, isScheduled, matchesDate } from './schedule';
import { cityOf, locationMatch } from './location';

export interface EventQuery {
  /** Proposals (no date yet) or scheduled events (confirmed, with a real date). */
  view: 'proposals' | 'scheduled';
  category: EventCategory | 'All';
  /** Only applies to scheduled events. */
  date: DateFilter;
  place: { city: string; scope: 'all' | 'near' | 'other' };
  search: string;
}

/**
 * The events the list shows. Cancelled events are withdrawn from the public page; proposals
 * never appear under a date filter; "other locations" includes places we can't place on the
 * map rather than guessing they are near.
 */
export function filterEvents(events: Event[], q: EventQuery, now: Date): Event[] {
  const search = q.search.trim().toLowerCase();
  const out = events.filter((e) => {
    if (e.status === 'Cancelled') return false;
    if (q.view === 'scheduled' ? !matchesDate(e, q.date, now) : isScheduled(e)) return false;
    if (q.category !== 'All' && e.category !== q.category) return false;
    if (q.place.scope !== 'all') {
      const match = locationMatch(cityOf(e), q.place.city);
      if (q.place.scope === 'near' ? match !== 'near' : match === 'near') return false;
    }
    if (search && ![e.title, e.description, e.category, cityOf(e)].some((t) => t.toLowerCase().includes(search))) return false;
    return true;
  });
  if (q.view === 'scheduled') out.sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime());
  return out;
}

/** True when anything narrows the list beyond "all proposals". */
export function hasActiveFilters(q: Omit<EventQuery, 'view' | 'search'>): boolean {
  return q.category !== 'All' || q.date !== 'any' || q.place.scope !== 'all';
}
