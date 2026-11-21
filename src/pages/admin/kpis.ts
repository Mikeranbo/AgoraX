/** The success criteria from AGORAX_BUILD_PLAN.md, measured live. */
export interface KpiTarget {
  label: string;
  actual: number;
  target: number;
  unit: '' | '%';
  met: boolean;
  how: string;
}

interface KpiInput {
  /** visits/{source}: page loads counted without any ID. */
  visits: { id: string; count?: number }[];
  /** People who did something (they have an ID). */
  users: { id: string; source?: string; hasContact?: boolean }[];
  joinerUids: Set<string>;
  joinsByEvent: Map<string, number>;
  helperUids: string[];
  spaceUids: string[];
}

const NOT_A_POSTER = new Set(['direct', 'share', '']);
const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

export function kpiTargets({ visits, users, joinerUids, joinsByEvent, helperUids, spaceUids }: KpiInput): KpiTarget[] {
  const count = (v: { count?: number }) => (typeof v.count === 'number' ? v.count : 0);
  const totalVisits = visits.reduce((a, v) => a + count(v), 0);
  const fromPosters = visits.filter((v) => !NOT_A_POSTER.has(v.id)).reduce((a, v) => a + count(v), 0);
  const pickRate = percent(users.filter((u) => joinerUids.has(u.id)).length, totalVisits);
  const contactRate = percent(users.filter((u) => u.hasContact).length, totalVisits);
  const eventsAt20 = [...joinsByEvent.values()].filter((n) => n >= 20).length;
  const offers = new Set([...helperUids, ...spaceUids]).size;

  const t = (label: string, actual: number, target: number, unit: '' | '%', how: string): KpiTarget => ({
    label,
    actual,
    target,
    unit,
    met: actual >= target,
    how,
  });

  return [
    t('Visits from posters', fromPosters, 200, '', 'page loads with a poster ?src=, counted without an ID'),
    t('Picked an event', pickRate, 40, '%', 'people with at least one join, per visit'),
    t('Left a contact', contactRate, 15, '%', 'people with WhatsApp or email, per visit'),
    t('Events at 20+', eventsAt20, 5, '', 'events with 20 or more joins'),
    t('Want to help or have a space', offers, 5, '', 'distinct people, helpers and space offers'),
  ];
}
