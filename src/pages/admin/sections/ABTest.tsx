import React from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Table, Td, num, pct } from '../ui';
import { isShortlisted } from '../../../data/simpleEvents';
import type { Variant } from '../../../config/concept';

const PAGES: { v: Variant; label: string }[] = [
  { v: 'simple', label: 'A · simple' },
  { v: 'current', label: 'B · current' },
];

/**
 * The A/B test, numbers only: page A (simple, 12 events) next to page B (current, 40 events).
 * Only real visits count: ?v= test visits are not in the visit counts, and their records carry a
 * "-test" variant, so they are shown apart. People, contacts, offers and messages need the owner role.
 */
export function ABTest() {
  const {
    state: { visits, stats, users, helpers, suggestions, events },
    meta: { isOwner },
  } = useAdmin();

  const eventIds = new Set(events.map((e) => e.id));
  const per = (v: Variant | `${Variant}-test`) => {
    const joins = stats.joins.filter((p) => p.variant === v);
    const pickers = new Set(joins.map((p) => p.uid)).size;
    return {
      visits: visits.reduce((a, d) => a + num((d as Record<string, unknown>)[v]), 0),
      joins: joins.length,
      pickers,
      contacts: users.filter((u) => u.variant === v && u.hasContact && (u.email || u.phone)).length,
      offers: helpers.filter((h) => h.variant === v && eventIds.has(h.eventId)).length,
      messages: suggestions.filter((s) => s.variant === v).length,
      byEvent: joins.reduce((m, p) => m.set(p.eventId, (m.get(p.eventId) ?? 0) + 1), new Map<string, number>()),
    };
  };
  const a = per('simple');
  const b = per('current');
  const testA = per('simple-test');
  const testB = per('current-test');
  const ownerOnly = (n: number) => (isOwner ? String(n) : 'owner only');
  const withPct = (n: number, of: number) => (isOwner ? `${n} · ${pct(n, of)}` : 'owner only');

  const rows: [string, (x: ReturnType<typeof per>) => string][] = [
    ['Visits (page loads)', (x) => String(x.visits)],
    ['Picked at least one event', (x) => `${x.pickers} · ${pct(x.pickers, x.visits)}`],
    ['Left a contact', (x) => withPct(x.contacts, x.visits)],
    ['Average picks per picker', (x) => (x.pickers ? (x.joins / x.pickers).toFixed(1) : '—')],
    ['Help-run offers', (x) => ownerOnly(x.offers)],
    ['Messages (A: "Tell us", B: ideas box)', (x) => ownerOnly(x.messages)],
  ];

  // Shown on both pages: on A's shortlist (B shows every event).
  const shared = events.filter((e) => isShortlisted(e) && e.status !== 'Cancelled');
  const testPicks = testA.joins + testB.joins;

  return (
    <Section title="A/B test" subtitle="A shows 12 events, B shows 40, so compare the percentages. Percent = of that page's visits.">
      <Table head={['', ...PAGES.map((p) => p.label)]}>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <Td className="text-slate-300">{label}</Td>
            <Td className="tabular-nums text-white font-bold">{value(a)}</Td>
            <Td className="tabular-nums text-white font-bold">{value(b)}</Td>
          </tr>
        ))}
      </Table>
      <p className="mt-2 text-xs text-slate-500">
        Test visits (?v=simple, ?v=current) are left out of everything above: {testPicks} {testPicks === 1 ? 'pick' : 'picks'} made on test visits so far.
      </p>

      <h3 className="mt-5 mb-2 text-sm font-bold text-white">Picks per event shown on both pages</h3>
      <Table head={['Event', 'A picks', 'A % of visits', 'B picks', 'B % of visits']} empty="No event is on both pages.">
        {shared
          .map((e) => ({ e, pa: a.byEvent.get(e.id) ?? 0, pb: b.byEvent.get(e.id) ?? 0 }))
          .sort((x, y) => y.pa + y.pb - (x.pa + x.pb) || x.e.title.localeCompare(y.e.title))
          .map(({ e, pa, pb }) => (
            <tr key={e.id}>
              <Td className="text-white">{e.title}</Td>
              <Td className="tabular-nums">{pa}</Td>
              <Td className="tabular-nums">{pct(pa, a.visits)}</Td>
              <Td className="tabular-nums">{pb}</Td>
              <Td className="tabular-nums">{pct(pb, b.visits)}</Td>
            </tr>
          ))}
      </Table>
    </Section>
  );
}
