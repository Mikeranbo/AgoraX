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
  users: { id: string; source?: string; hasContact?: boolean }[];
  joinerUids: Set<string>;
  joinsByEvent: Map<string, number>;
  helperUids: string[];
  spaceUids: string[];
}

const NOT_A_POSTER = new Set(['direct', 'share', '']);
const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

export function kpiTargets({ users, joinerUids, joinsByEvent, helperUids, spaceUids }: KpiInput): KpiTarget[] {
  const fromPosters = users.filter((u) => !NOT_A_POSTER.has(u.source ?? '')).length;
  const pickRate = percent(users.filter((u) => joinerUids.has(u.id)).length, users.length);
  const contactRate = percent(users.filter((u) => u.hasContact).length, users.length);
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
    t('Visits from posters', fromPosters, 200, '', 'visitors whose first ?src= was a poster'),
    t('Picked an event', pickRate, 40, '%', 'visitors with at least one join'),
    t('Left a contact', contactRate, 15, '%', 'visitors with WhatsApp or email'),
    t('Events at 20+', eventsAt20, 5, '', 'events with 20 or more joins'),
    t('Want to help or have a space', offers, 5, '', 'distinct people, helpers and space offers'),
  ];
}
