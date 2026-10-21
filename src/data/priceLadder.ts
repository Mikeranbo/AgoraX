import { SEED_EVENTS } from './seedEvents';
import type { Event } from '../types';

/**
 * Price ladder: after someone joins at the low tier we ask whether they would still come at
 * the next tier up. The low tier is the seed price; the step is roughly +40%, rounded to a
 * whole euro (chess 2 → 3, clay 18 → 25). Free events are asked about €2.
 *
 * Derived from SEED_EVENTS so the two lists can never drift apart.
 */
export interface LadderTier {
  basePrice: number;
  nextPrice: number;
}

function step(price: number): number {
  if (price <= 0) return 2;
  return Math.max(price + 1, Math.round(price * 1.4));
}

export const PRICE_LADDER: Record<string, LadderTier> = Object.fromEntries(
  SEED_EVENTS.map((e) => [e.slug, { basePrice: e.price, nextPrice: step(e.price) }]),
);

/** The price to ask about for this event — always strictly above what the person saw. */
export function nextPriceFor(event: Pick<Event, 'slug' | 'id' | 'price'>): number {
  const tier = PRICE_LADDER[event.slug ?? event.id];
  const candidate = tier ? tier.nextPrice : step(event.price);
  return Math.max(candidate, event.price + 1);
}
