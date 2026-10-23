import { useCallback, useEffect, useMemo, useState } from 'react';
import { subscribeCollection, subscribeHelpers, subscribeParticipants } from '../../services/adminService';
import { AdminDoc, Event, HelperDoc, ParticipantDoc, Proposal, UserDoc, VenueOffer } from '../../types';
import { num, tsMs } from './ui';
import { kpiTargets } from './kpis';
import { countersToFix } from './recount';

/** What this admin's role may load. The rules refuse the rest, so don't subscribe to it. */
export interface AdminAccess {
  /** users/{uid}: names, contact details, price answers (owner + editor). */
  people: boolean;
  /** The admins list (owner only). */
  admins: boolean;
}

export interface Suggestion {
  id: string;
  uid: string;
  text: string;
  source?: string;
  ts?: any;
}

/** Who someone is, from users/{uid} — the only place contact details are kept. */
function personOf(user: (UserDoc & { id: string }) | undefined) {
  return {
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    source: user?.source ?? 'direct',
  };
}

/** Every live listener the admin page needs, plus the numbers derived from them. */
export function useAdminData(access: AdminAccess) {
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<(UserDoc & { id: string })[]>([]);
  const [participants, setParticipants] = useState<ParticipantDoc[]>([]);
  const [helpers, setHelpers] = useState<HelperDoc[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [venueOffers, setVenueOffers] = useState<VenueOffer[]>([]);
  const [admins, setAdmins] = useState<AdminDoc[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const addError = useCallback((message: string) => {
    setErrors((prev) => (prev.includes(message) ? prev : [...prev, message]));
  }, []);
  const clearErrors = useCallback(() => setErrors([]), []);

  useEffect(() => {
    const unsubs = [
      subscribeCollection<Event>('events', setEvents, (e) => addError(`events: ${e.message}`)),
      subscribeParticipants(setParticipants, (e) => addError(`participants: ${e.message}`)),
      subscribeHelpers(setHelpers, (e) => addError(`helpers: ${e.message}`)),
      subscribeCollection<Proposal>('proposals', setProposals, (e) => addError(`proposals: ${e.message}`)),
      subscribeCollection<Suggestion>('suggestions', setSuggestions, (e) => addError(`suggestions: ${e.message}`)),
      subscribeCollection<VenueOffer>('venueOffers', setVenueOffers, (e) => addError(`venueOffers: ${e.message}`)),
    ];
    if (access.people) {
      unsubs.push(subscribeCollection<UserDoc>('users', setUsers, (e) => addError(`users: ${e.message}`)));
    }
    if (access.admins) {
      unsubs.push(
        subscribeCollection<AdminDoc>('admins', (list) => setAdmins(list.map((a) => ({ ...a, uid: a.id }))), (e) => addError(`admins: ${e.message}`)),
      );
    }
    return () => unsubs.forEach((u) => u());
  }, [addError, access.people, access.admins]);

  const stats = useMemo(() => {
    const eventIds = new Set(events.map((e) => e.id));
    // Deleting an event leaves its participant documents behind; ignore the orphans.
    const joins = participants.filter((p) => eventIds.has(p.eventId));
    const joiners = new Set(joins.map((p) => p.uid));
    const contacts = users.filter((u) => u.hasContact);

    const joinsByEvent = new Map<string, number>();
    joins.forEach((p) => joinsByEvent.set(p.eventId, (joinsByEvent.get(p.eventId) ?? 0) + 1));

    // Host interest comes from the helper documents (one per person per event), like joins.
    const offers = helpers.filter((h) => eventIds.has(h.eventId));
    const interestByEvent = new Map<string, number>();
    offers.forEach((h) => interestByEvent.set(h.eventId, (interestByEvent.get(h.eventId) ?? 0) + 1));

    const sum = (field: 'impressions' | 'opens') => events.reduce((a, e) => a + num(e[field]), 0);

    return {
      visitors: users.length,
      totalJoins: joins.length,
      joiners: joiners.size,
      contacts: contacts.length,
      avgPicks: joiners.size ? joins.length / joiners.size : 0,
      organiserTaps: offers.length,
      impressions: sum('impressions'),
      opens: sum('opens'),
      joinsByEvent,
      interestByEvent,
      joins,
    };
  }, [events, users, participants, helpers]);

  const eventRows = useMemo(
    () =>
      events
        .map((e) => {
          const joins = stats.joinsByEvent.get(e.id) ?? 0;
          const opens = num(e.opens);
          return {
            event: e,
            joins,
            impressions: num(e.impressions),
            opens,
            conversion: opens > 0 ? joins / opens : null,
            interest: stats.interestByEvent.get(e.id) ?? 0,
          };
        })
        .sort((a, b) => b.joins - a.joins || a.event.title.localeCompare(b.event.title)),
    [events, stats],
  );

  const sourceRows = useMemo(() => {
    const map = new Map<string, { visitors: number; joins: number; contacts: number }>();
    const row = (s?: string) => {
      const key = s || 'direct';
      if (!map.has(key)) map.set(key, { visitors: 0, joins: 0, contacts: 0 });
      return map.get(key)!;
    };
    users.forEach((u) => {
      const r = row(u.source);
      r.visitors++;
      if (u.hasContact) r.contacts++;
    });
    stats.joins.forEach((p) => {
      row(p.source).joins++;
    });
    return [...map.entries()].map(([source, v]) => ({ source, ...v })).sort((a, b) => b.joins - a.joins || b.visitors - a.visitors);
  }, [users, stats]);

  const ladderRows = useMemo(() => {
    const byEvent = new Map<string, { yes: number; no: number; depends: number; priceAsked: number }>();
    users.forEach((u) => {
      Object.entries(u.priceAnswers ?? {}).forEach(([eventId, a]) => {
        const r = byEvent.get(eventId) ?? { yes: 0, no: 0, depends: 0, priceAsked: a.priceAsked };
        r[a.answer]++;
        byEvent.set(eventId, r);
      });
    });
    const titles = new Map(events.map((e) => [e.id, e]));
    return [...byEvent.entries()]
      .filter(([id]) => titles.has(id))
      .map(([id, r]) => ({ event: titles.get(id)!, ...r, total: r.yes + r.no + r.depends }))
      .sort((a, b) => b.total - a.total);
  }, [users, events]);

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const helperRows = useMemo(() => {
    const titles = new Map(events.map((e) => [e.id, e.title]));
    return helpers
      .filter((h) => titles.has(h.eventId))
      .map((h) => ({
        key: `${h.uid}-${h.eventId}`,
        event: titles.get(h.eventId)!,
        ranBefore: h.ranBefore,
        uid: h.uid,
        ...personOf(usersById.get(h.uid)),
      }))
      .sort((a, b) => a.event.localeCompare(b.event));
  }, [helpers, events, usersById]);

  // Drafts are still being written by their authors: not ready for review, so not listed.
  const proposalRows = useMemo(() => {
    const order = { draft: 3, new: 0, approved: 1, rejected: 2 } as const;
    return proposals
      .filter((p) => p.status !== 'draft')
      .sort((a, b) => order[a.status] - order[b.status] || tsMs(b.ts) - tsMs(a.ts))
      .map((p) => ({ proposal: p, ...personOf(usersById.get(p.uid)) }));
  }, [proposals, usersById]);

  const suggestionRows = useMemo(() => [...suggestions].sort((a, b) => tsMs(b.ts) - tsMs(a.ts)), [suggestions]);
  const offerRows = useMemo(
    () => [...venueOffers].sort((a, b) => tsMs(b.ts) - tsMs(a.ts)).map((o) => ({ offer: o, ...personOf(usersById.get(o.uid)) })),
    [venueOffers, usersById],
  );

  const targets = useMemo(
    () =>
      kpiTargets({
        users,
        joinerUids: new Set(stats.joins.map((p) => p.uid)),
        joinsByEvent: stats.joinsByEvent,
        helperUids: helpers.map((h) => h.uid),
        spaceUids: venueOffers.map((o) => o.uid),
      }),
    [users, stats, helpers, venueOffers],
  );

  // "When would suit you?" per event, among the people interested in it. A preference, not availability.
  const timingRows = useMemo(() => {
    const timing = new Map(users.map((u) => [u.id, u.preferredTiming]));
    return events
      .map((e) => {
        const row = { event: e, 'weekday-evening': 0, weekend: 0, flexible: 0, unknown: 0, total: 0 };
        stats.joins
          .filter((p) => p.eventId === e.id)
          .forEach((p) => {
            const t = timing.get(p.uid);
            row[t ?? 'unknown']++;
            row.total++;
          });
        return row;
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [events, users, stats]);

  const counterFixes = useMemo(() => countersToFix(events, participants, helpers), [events, participants, helpers]);

  const adminRows = useMemo(
    () => [...admins].sort((a, b) => a.role.localeCompare(b.role) || (a.label ?? '').localeCompare(b.label ?? '')),
    [admins],
  );

  return {
    events,
    users,
    proposals,
    suggestions,
    venueOffers,
    errors,
    addError,
    clearErrors,
    stats,
    eventRows,
    sourceRows,
    ladderRows,
    helperRows,
    proposalRows,
    suggestionRows,
    offerRows,
    adminRows,
    timingRows,
    counterFixes,
    targets,
  };
}

export type AdminData = ReturnType<typeof useAdminData>;
