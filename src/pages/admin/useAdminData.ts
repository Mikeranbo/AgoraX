import { useCallback, useEffect, useMemo, useState } from 'react';
import { subscribeCollection, subscribeParticipants } from '../../services/adminService';
import { AdminDoc, Event, ParticipantDoc, UserDoc } from '../../types';
import { num, tsMs } from './ui';

export interface Suggestion {
  id: string;
  uid: string;
  text: string;
  contact?: string;
  source?: string;
  ts?: any;
}

export interface LegacyVenueOffer {
  id: string;
  uid: string;
  name: string;
  spaceType: string;
  contact: string;
  source?: string;
  ts?: any;
}

/** Every live listener the admin page needs, plus the numbers derived from them. */
export function useAdminData() {
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<(UserDoc & { id: string })[]>([]);
  const [participants, setParticipants] = useState<ParticipantDoc[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [venueOffers, setVenueOffers] = useState<LegacyVenueOffer[]>([]);
  const [admins, setAdmins] = useState<AdminDoc[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const addError = useCallback((message: string) => {
    setErrors((prev) => (prev.includes(message) ? prev : [...prev, message]));
  }, []);
  const clearErrors = useCallback(() => setErrors([]), []);

  useEffect(() => {
    const unsubs = [
      subscribeCollection<Event>('events', setEvents, (e) => addError(`events: ${e.message}`)),
      subscribeCollection<UserDoc>('users', setUsers, (e) => addError(`users: ${e.message}`)),
      subscribeParticipants(setParticipants, (e) => addError(`participants: ${e.message}`)),
      subscribeCollection<Suggestion>('suggestions', setSuggestions, (e) => addError(`suggestions: ${e.message}`)),
      subscribeCollection<LegacyVenueOffer>('venueOffers', setVenueOffers, (e) => addError(`venueOffers: ${e.message}`)),
      subscribeCollection<AdminDoc>('admins', (list) => setAdmins(list.map((a) => ({ ...a, uid: a.id }))), (e) => addError(`admins: ${e.message}`)),
    ];
    return () => unsubs.forEach((u) => u());
  }, [addError]);

  const stats = useMemo(() => {
    const eventIds = new Set(events.map((e) => e.id));
    // Deleting an event leaves its participant documents behind; ignore the orphans.
    const joins = participants.filter((p) => eventIds.has(p.eventId));
    const joiners = new Set(joins.map((p) => p.uid));
    const contacts = users.filter((u) => u.hasContact);

    const joinsByEvent = new Map<string, number>();
    joins.forEach((p) => joinsByEvent.set(p.eventId, (joinsByEvent.get(p.eventId) ?? 0) + 1));

    const sum = (field: 'impressions' | 'opens' | 'organiserInterest') => events.reduce((a, e) => a + num(e[field]), 0);

    return {
      visitors: users.length,
      totalJoins: joins.length,
      joiners: joiners.size,
      contacts: contacts.length,
      avgPicks: joiners.size ? joins.length / joiners.size : 0,
      organiserTaps: sum('organiserInterest'),
      impressions: sum('impressions'),
      opens: sum('opens'),
      joinsByEvent,
      joins,
    };
  }, [events, users, participants]);

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
            interest: num(e.organiserInterest),
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

  const hostingRows = useMemo(() => {
    const titles = new Map(events.map((e) => [e.id, e.title]));
    return users.flatMap((u) =>
      (u.organiserEvents ?? []).map((eventId) => ({
        key: `${u.id}-${eventId}`,
        event: titles.get(eventId) ?? `(deleted: ${eventId})`,
        name: u.name ?? '',
        phone: u.phone ?? '',
        email: u.email ?? '',
        source: u.source ?? 'direct',
        uid: u.id,
      })),
    );
  }, [users, events]);

  const suggestionRows = useMemo(() => [...suggestions].sort((a, b) => tsMs(b.ts) - tsMs(a.ts)), [suggestions]);
  const offerRows = useMemo(() => [...venueOffers].sort((a, b) => tsMs(b.ts) - tsMs(a.ts)), [venueOffers]);
  const adminRows = useMemo(
    () => [...admins].sort((a, b) => a.role.localeCompare(b.role) || (a.label ?? '').localeCompare(b.label ?? '')),
    [admins],
  );

  return {
    events,
    users,
    suggestions,
    venueOffers,
    errors,
    addError,
    clearErrors,
    stats,
    eventRows,
    sourceRows,
    ladderRows,
    hostingRows,
    suggestionRows,
    offerRows,
    adminRows,
  };
}

export type AdminData = ReturnType<typeof useAdminData>;
