import { describe, expect, it } from 'vitest';
import { earningsFor, keepPerHost } from './earnings';
import { seedAsEvent } from '../test/seedEvent';

describe('earnings', () => {
  it('works out the Brain Battle breakdown: 24 × €3, 7% fee, €20 prize pot, two hosts', () => {
    const e = earningsFor(seedAsEvent('themed-pub-quiz'));
    expect(e.gross).toBe(72);
    expect(e.platformFee).toBeCloseTo(5.04, 2);
    expect(e.costs).toBe(20);
    expect(e.perHost).toBeCloseTo(23.48, 2);
    expect(keepPerHost(seedAsEvent('themed-pub-quiz'))).toBe(23);
  });

  it('never shows negative earnings', () => {
    expect(earningsFor(seedAsEvent('reading-meetup')).perHost).toBe(0);
  });
});
