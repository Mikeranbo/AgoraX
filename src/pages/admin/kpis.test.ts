import { describe, expect, it } from 'vitest';
import { kpiTargets } from './kpis';

const base = {
  visits: [] as { id: string; count?: number }[],
  users: [] as { id: string; source?: string; hasContact?: boolean }[],
  joinerUids: new Set<string>(),
  joinsByEvent: new Map<string, number>(),
  helperUids: [] as string[],
  spaceUids: [] as string[],
};

describe('kpiTargets (AGORAX_BUILD_PLAN success criteria)', () => {
  it('counts only poster visits toward the 200-visit target', () => {
    const visits = [
      { id: 'ub', count: 3 },
      { id: 'direct', count: 50 },
      { id: 'share', count: 7 },
      { id: 'bernoulli', count: 2 },
    ];
    const t = kpiTargets({ ...base, visits });
    expect(t[0]).toMatchObject({ actual: 5, target: 200, met: false });
  });

  it('measures pick and contact rates against all visits', () => {
    const users = Array.from({ length: 10 }, (_, i) => ({ id: `u${i}`, source: 'ub', hasContact: i < 2 }));
    const t = kpiTargets({ ...base, visits: [{ id: 'ub', count: 10 }], users, joinerUids: new Set(['u0', 'u1', 'u2', 'u3']) });
    expect(t[1]).toMatchObject({ actual: 40, target: 40, met: true });
    expect(t[2]).toMatchObject({ actual: 20, target: 15, met: true });
  });

  it('counts events with at least 20 people', () => {
    const joinsByEvent = new Map([['a', 20], ['b', 19], ['c', 31]]);
    expect(kpiTargets({ ...base, joinsByEvent })[3]).toMatchObject({ actual: 2, target: 5, met: false });
  });

  it('counts a person who both helps and offers a space once', () => {
    const t = kpiTargets({ ...base, helperUids: ['x', 'y', 'x'], spaceUids: ['y', 'z'] });
    expect(t[4]).toMatchObject({ actual: 3, target: 5, met: false });
  });

  it('reports 0% instead of NaN with no visitors', () => {
    const t = kpiTargets(base);
    expect(t[1].actual).toBe(0);
    expect(t[2].actual).toBe(0);
  });
});
