import { SEED_EVENTS } from '../data/seedEvents';
import type { Event } from '../types';

/** A seed entry shaped like the Firestore event it becomes, for tests. */
export function seedAsEvent(slug: string, overrides: Partial<Event> = {}): Event {
  const s = SEED_EVENTS.find((e) => e.slug === slug);
  if (!s) throw new Error(`no seed event ${slug}`);
  return {
    ...s,
    id: s.slug,
    participantsCount: 0,
    deadline: '',
    startTime: '',
    status: 'Pending',
    organizerId: 'agorax',
    imageUrls: [],
    ...overrides,
  };
}
