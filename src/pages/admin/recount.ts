import { Event, HelperDoc, ParticipantDoc } from '../../types';

export interface CounterFix {
  id: string;
  title: string;
  participantsCount: number;
  organiserInterest: number;
}

/**
 * Events whose stored counters differ from their real sign-ups: one participant document per
 * person who joined, one helper document per person who offered to help. Counters inflated
 * before the rules tied them to those documents show up here with the corrected values.
 */
export function countersToFix(
  events: Pick<Event, 'id' | 'title' | 'participantsCount' | 'joins' | 'organiserInterest'>[],
  participants: Pick<ParticipantDoc, 'eventId'>[],
  helpers: Pick<HelperDoc, 'eventId'>[],
): CounterFix[] {
  const tally = (docs: { eventId: string }[]) => {
    const m = new Map<string, number>();
    docs.forEach((d) => m.set(d.eventId, (m.get(d.eventId) ?? 0) + 1));
    return m;
  };
  const joined = tally(participants);
  const offered = tally(helpers);
  return events
    .map((e) => ({
      event: e,
      fix: { id: e.id, title: e.title, participantsCount: joined.get(e.id) ?? 0, organiserInterest: offered.get(e.id) ?? 0 },
    }))
    .filter(
      ({ event, fix }) =>
        (event.participantsCount ?? 0) !== fix.participantsCount ||
        (event.joins ?? 0) !== fix.participantsCount ||
        (event.organiserInterest ?? 0) !== fix.organiserInterest,
    )
    .map(({ fix }) => fix);
}
