import { describe, expect, it } from 'vitest';
import { PAGES, chooseVariant } from './concept';

const flip = (value: number) => () => value;

describe('A/B variant choice', () => {
  it('flips a fair coin for a new visitor, and the visit counts', () => {
    expect(chooseVariant({ query: '', saved: null, random: flip(0.2) })).toEqual({ page: 'simple', stamp: 'simple', counts: true });
    expect(chooseVariant({ query: '', saved: null, random: flip(0.7) })).toEqual({ page: 'current', stamp: 'current', counts: true });
  });

  it('keeps the page a browser saved at its first action', () => {
    expect(chooseVariant({ query: '', saved: 'current', random: flip(0.1) })).toEqual({ page: 'current', stamp: 'current', counts: true });
    expect(chooseVariant({ query: '', saved: 'simple', random: flip(0.9) })).toEqual({ page: 'simple', stamp: 'simple', counts: true });
  });

  it('?v= forces a page, marks it as a test and never counts it', () => {
    expect(chooseVariant({ query: '?v=simple&src=x', saved: 'current', random: flip(0.9) })).toEqual({ page: 'simple', stamp: 'simple-test', counts: false });
    expect(chooseVariant({ query: '?v=current', saved: null, random: flip(0.1) })).toEqual({ page: 'current', stamp: 'current-test', counts: false });
  });

  it('a browser that acted on a test visit keeps that page, still as a test', () => {
    expect(chooseVariant({ query: '', saved: 'simple-test', random: flip(0.9) })).toEqual({ page: 'simple', stamp: 'simple-test', counts: false });
  });

  it('ignores unknown values', () => {
    expect(chooseVariant({ query: '?v=other', saved: 'nonsense', random: flip(0.9) })).toEqual({ page: 'current', stamp: 'current', counts: true });
  });

  it('both pages show the pilot notice on arrival, so only the design differs', () => {
    expect(PAGES.simple.pilotNoticeOnEntry).toBe(true);
    expect(PAGES.current.pilotNoticeOnEntry).toBe(true);
  });

  it('the browser tests can replace the coin flip', () => {
    expect(chooseVariant({ query: '', saved: null, forcedByBuild: 'simple', random: flip(0.9) }).page).toBe('simple');
  });
});
