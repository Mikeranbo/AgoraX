import { describe, expect, it } from 'vitest';
import { SEED_EVENTS } from './seedEvents';
import { SIMPLE_EVENTS, isOnPageA } from './simpleEvents';
import { earningsFor } from './earnings';
import type { Event } from '../types';

describe('page A plain answers', () => {
  it('every seed event has its four answers, and no answers are left over', () => {
    const slugs = SEED_EVENTS.map((e) => e.slug).sort();
    expect(Object.keys(SIMPLE_EVENTS).sort()).toEqual(slugs);
    for (const slug of slugs) {
      const c = SIMPLE_EVENTS[slug];
      expect(c.does, slug).not.toBe('');
      expect(c.included, slug).not.toBe('');
      expect(c.pays, slug).not.toBe('');
    }
  });

  it('"What the price pays for" names the price page A shows (the seed price)', () => {
    for (const e of SEED_EVENTS) {
      const pays = SIMPLE_EVENTS[e.slug].pays;
      if (e.price === 0) expect(pays, e.slug).toMatch(/^Free/);
      else expect(pays.startsWith(`€${e.price}`), `${e.slug}: ${pays}`).toBe(true);
    }
  });

  it('names the materials or hire cost per person when it is €1.50 or more', () => {
    for (const e of SEED_EVENTS) {
      const perPerson = e.fixedCost / e.minParticipants + e.perPersonCost;
      if (perPerson < 1.5 || e.price === 0) continue;
      // "€10: €5 for your bag…" or "about €8 for the courts"
      const euros = [...SIMPLE_EVENTS[e.slug].pays.matchAll(/€(\d+)/g)].map((m) => Number(m[1]));
      expect(euros.slice(1), e.slug).toContain(Math.round(perPerson));
    }
  });

  it('uses no dashes as connectors', () => {
    for (const [slug, c] of Object.entries(SIMPLE_EVENTS)) {
      for (const text of [c.does, c.included, c.bring, c.pays]) expect(text, slug).not.toMatch(/[—–]| - /);
    }
  });
});

describe('isOnPageA', () => {
  it('shows every event unless /admin took it off page A', () => {
    expect(isOnPageA({})).toBe(true);
    expect(isOnPageA({ visible: true })).toBe(true);
    expect(isOnPageA({ visible: false })).toBe(false);
  });
});

describe('the tournaments', () => {
  const t = (slug: string) => SEED_EVENTS.find((e) => e.slug === slug)!;

  it('are three Sports events, called tournaments and never a challenge', () => {
    const sports = SEED_EVENTS.filter((e) => e.category === 'Sports');
    expect(sports.map((e) => e.title)).toEqual(['Ping-Pong Tournament', 'Padel Tournament', 'Tennis Tournament']);
    for (const e of sports) {
      expect(`${e.title} ${e.description} ${SIMPLE_EVENTS[e.slug].does}`.toLowerCase()).not.toContain('challenge');
      expect(e.description).toContain('ACLO');
    }
  });

  it('keep the old Ping-Pong Challenge and Padel Cup numbers', () => {
    expect(t('ping-pong-tournament')).toMatchObject({ price: 3, minParticipants: 12, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0 });
    expect(t('padel-tournament')).toMatchObject({ price: 12, minParticipants: 16, hostsNeeded: 1, fixedCost: 120, perPersonCost: 0 });
    expect(t('tennis-tournament')).toMatchObject({ price: 12, minParticipants: 16, hostsNeeded: 1, fixedCost: 140, perPersonCost: 0 });
  });

  it('pay a host something at the minimum', () => {
    for (const slug of ['ping-pong-tournament', 'padel-tournament', 'tennis-tournament']) {
      expect(earningsFor(t(slug) as unknown as Event).perHost, slug).toBeGreaterThan(0);
    }
  });
});
