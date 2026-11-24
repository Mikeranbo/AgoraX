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

describe('prices (Mike, 23 Nov 2026)', () => {
  const byId = (slug: string) => SEED_EVENTS.find((e) => e.slug === slug)!;

  it('events that depend on the people who come are free, and so is every Networking event', () => {
    for (const slug of ['walk-and-talk-groningen', 'trading-strategy-meetup', 'coffee-roulette', 'reading-meetup', 'hiking-trip',
      'board-game-discovery', 'thrift-and-style-swap', 'machine-learning-jam', 'build-an-app-challenge', 'friendly-debate', 'short-film-challenge']) {
      expect(byId(slug).price, slug).toBe(0);
    }
    for (const e of SEED_EVENTS.filter((x) => x.category === 'Networking')) expect(e.price, e.slug).toBe(0);
  });

  it('a free event says Free and never asks a host to pay its small costs', () => {
    for (const e of SEED_EVENTS.filter((x) => x.price === 0)) {
      expect(SIMPLE_EVENTS[e.slug].pays, e.slug).toMatch(/^Free/);
      expect(e.fixedCost / e.minParticipants + e.perPersonCost, e.slug).toBeLessThan(1.5);
    }
  });

  it('nothing costs more than its real costs per person plus €3', () => {
    for (const e of SEED_EVENTS) {
      const costs = e.fixedCost / e.minParticipants + e.perPersonCost;
      expect(e.price - costs, e.slug).toBeLessThanOrEqual(3);
      if (costs === 0) expect(e.price, e.slug).toBeLessThanOrEqual(3);
    }
  });

  it('a description that names its price names the current one', () => {
    for (const e of SEED_EVENTS) {
      for (const m of e.description.matchAll(/the €(\d+)/gi)) expect(Number(m[1]), e.slug).toBe(e.price);
    }
  });

  it('the mock exam is for any subject, and the management game is our own, TOPSIM-style, for €2', () => {
    expect(byId('mock-exam-session').title).toBe('Mock Exam (any subject)');
    expect(byId('topsim-competition')).toMatchObject({ title: 'Management Game Competition (TOPSIM-style)', category: 'Study', price: 2 });
    expect(byId('topsim-competition').description).toContain('our own management game');
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

  it('only pay for the organisation: ACLO provides the padel and tennis courts', () => {
    expect(t('ping-pong-tournament')).toMatchObject({ price: 3, minParticipants: 12, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0 });
    expect(t('padel-tournament')).toMatchObject({ price: 3, minParticipants: 16, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0, venueNote: 'ACLO padel courts' });
    expect(t('tennis-tournament')).toMatchObject({ price: 3, minParticipants: 16, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0, venueNote: 'ACLO tennis courts' });
  });

  it('pay a host something at the minimum', () => {
    for (const slug of ['ping-pong-tournament', 'padel-tournament', 'tennis-tournament']) {
      expect(earningsFor(t(slug) as unknown as Event).perHost, slug).toBeGreaterThan(0);
    }
  });
});
