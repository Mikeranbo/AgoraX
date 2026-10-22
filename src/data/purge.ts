import type { Event } from '../types';

/**
 * Ids of events to delete: everything that is not one of the seed slugs, except events an
 * admin created by approving a proposal (origin 'proposal').
 */
export function selectEventsToPurge(events: Pick<Event, 'id' | 'origin'>[], seedSlugs: string[]): string[] {
  const keep = new Set(seedSlugs);
  return events.filter((e) => !keep.has(e.id) && e.origin !== 'proposal').map((e) => e.id);
}
