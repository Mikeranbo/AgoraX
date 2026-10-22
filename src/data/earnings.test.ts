import { describe, expect, it } from 'vitest';
import { earningsFor, keepPerHost } from './earnings';
import { seedAsEvent } from '../test/seedEvent';

describe('earnings', () => {
  it('matches the Boxing Intro breakdown in APP_CHANGES §6', () => {
    const e = earningsFor(seedAsEvent('boxing-martial-arts-intro'));
    expect(e.gross).toBe(144);
    expect(e.platformFee).toBeCloseTo(10.08, 2);
    expect(e.costs).toBe(50);
    expect(e.perHost).toBeCloseTo(83.92, 2);
    expect(keepPerHost(seedAsEvent('boxing-martial-arts-intro'))).toBe(84);
  });

  it('never shows negative earnings', () => {
    expect(earningsFor(seedAsEvent('running-club')).perHost).toBe(0);
  });
});
