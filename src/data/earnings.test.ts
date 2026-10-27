import { describe, expect, it } from 'vitest';
import { earningsFor, keepPerHost } from './earnings';
import { seedAsEvent } from '../test/seedEvent';

describe('earnings', () => {
  it('works out the Brain Battle breakdown: 24 × €5, 7% fee, €20 prize pot, two hosts', () => {
    const e = earningsFor(seedAsEvent('themed-pub-quiz'));
    expect(e.gross).toBe(120);
    expect(e.platformFee).toBeCloseTo(8.4, 2);
    expect(e.costs).toBe(20);
    expect(e.perHost).toBeCloseTo(45.8, 2);
    expect(keepPerHost(seedAsEvent('themed-pub-quiz'))).toBe(46);
  });

  it('never shows negative earnings', () => {
    expect(earningsFor(seedAsEvent('reading-meetup')).perHost).toBe(0);
  });
});
