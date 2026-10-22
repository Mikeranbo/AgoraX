import { describe, expect, it } from 'vitest';
import { nextPriceFor } from './priceLadder';
import { SEED_EVENTS } from './seedEvents';
import { seedAsEvent } from '../test/seedEvent';

describe('price ladder', () => {
  it('asks chess players about €4, as in APP_CHANGES §7', () => {
    expect(nextPriceFor(seedAsEvent('chess-challenge'))).toBe(4);
  });

  it('asks about €2 for a free event', () => {
    expect(nextPriceFor(seedAsEvent('running-club'))).toBe(2);
  });

  it('always asks about a price above the one shown', () => {
    for (const s of SEED_EVENTS) {
      expect(nextPriceFor(seedAsEvent(s.slug))).toBeGreaterThan(s.price);
    }
  });

  it('still steps up when an admin has raised the price above the seed tier', () => {
    expect(nextPriceFor(seedAsEvent('chess-challenge', { price: 9 }))).toBe(10);
  });
});
