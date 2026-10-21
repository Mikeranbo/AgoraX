import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Plus, Pencil, Trash2, Sprout } from 'lucide-react';
import { ensureAnonymousAuth, describeAuthError } from '../services/identity';
import { seedEvents } from '../services/firebaseService';
import {
  subscribeCollection,
  subscribeParticipants,
  subscribeToAdmin,
  setEventStatus,
  deleteEvent,
  grantAdmin,
  revokeAdmin,
} from '../services/adminService';
import { downloadCsv } from '../lib/csv';
import { AdminDoc, AdminRole, Event, EventStatus, ParticipantDoc, UserDoc } from '../types';
import { EventEditor } from './admin/EventEditor';
import { Bar, Section, Table, Td, Tile, formatTs, num, pct, tsMs } from './admin/ui';

interface Suggestion {
  id: string;
  uid: string;
  text: string;
  contact?: string;
  source?: string;
  ts?: any;
}
interface VenueOffer {
  id: string;
  uid: string;
  name: string;
  spaceType: string;
  contact: string;
  source?: string;
  ts?: any;
}

const Spinner = () => (
  <div className="min-h-screen bg-[#0f172a] flex items-center justify-center" role="status" aria-label="Loading">
    <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

/** Never crashes: anything that is not an admin (or cannot be checked) lands here with their uid. */
const NotAuthorised = ({ uid, detail }: { uid: string; detail?: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the id is selectable text */
    }
  };
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        <h1 className="font-display text-2xl font-black text-white mb-2">Not authorised</h1>
        <p className="text-sm text-slate-400 mb-5">
          This page is for AgoraX admins. If you should have access, send an owner this ID so they can grant it:
        </p>
        {uid ? (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-3 mb-5">
            <code className="text-xs text-brand-secondary break-all flex-grow text-left select-all">{uid}</code>
            <button onClick={copy} aria-label="Copy your ID" className="p-1.5 text-slate-400 hover:text-white">
              <Copy size={16} />
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 mb-5">Your ID is unavailable because sign-in did not complete.</p>
        )}
        {copied && <p className="text-xs text-green-300 mb-3">Copied.</p>}
        {detail && <p className="text-[11px] text-slate-500 mb-5 break-words">{detail}</p>}
        <Link to="/" className="text-sm font-bold text-brand-secondary underline underline-offset-4">
          Back to AgoraX
        </Link>
      </div>
    </div>
  );
};

export default function AdminPage() {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [uid, setUid] = useState('');
  const [admin, setAdmin] = useState<AdminDoc | null | undefined>(undefined);
  const [detail, setDetail] = useState('');

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    document.title = 'AgoraX admin';

    ensureAnonymousAuth()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        setPhase('ready');
        unsubscribe = subscribeToAdmin(
          user.uid,
          (doc) => setAdmin(doc),
          (err) => {
            // Usually: the new Firestore rules have not been published yet.
            setDetail(`Could not check admin access: ${err.message}`);
            setAdmin(null);
          },
        );
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setDetail(describeAuthError(err));
        setPhase('error');
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  if (phase === 'loading' || (phase === 'ready' && admin === undefined)) return <Spinner />;
  if (phase === 'error' || !admin) return <NotAuthorised uid={uid} detail={detail} />;
  return <Dashboard uid={uid} admin={admin} />;
}

// ---------------------------------------------------------------------------

function Dashboard({ uid, admin }: { uid: string; admin: AdminDoc }) {
  const canEdit = admin.role === 'owner' || admin.role === 'editor';
  const isOwner = admin.role === 'owner';

  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<(UserDoc & { id: string })[]>([]);
  const [participants, setParticipants] = useState<ParticipantDoc[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [venueOffers, setVenueOffers] = useState<VenueOffer[]>([]);
  const [admins, setAdmins] = useState<AdminDoc[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<Event | 'new' | null>(null);
  const [seeding, setSeeding] = useState(false);

  const addError = useCallback((message: string) => {
    setErrors((prev) => (prev.includes(message) ? prev : [...prev, message]));
  }, []);

  useEffect(() => {
    const unsubs = [
      subscribeCollection<Event>('events', setEvents, (e) => addError(`events: ${e.message}`)),
      subscribeCollection<UserDoc>('users', setUsers, (e) => addError(`users: ${e.message}`)),
      subscribeParticipants(setParticipants, (e) => addError(`participants: ${e.message}`)),
      subscribeCollection<Suggestion>('suggestions', setSuggestions, (e) => addError(`suggestions: ${e.message}`)),
      subscribeCollection<VenueOffer>('venueOffers', setVenueOffers, (e) => addError(`venueOffers: ${e.message}`)),
      subscribeCollection<AdminDoc>('admins', (list) => setAdmins(list.map((a) => ({ ...a, uid: a.id }))), (e) => addError(`admins: ${e.message}`)),
    ];
    return () => unsubs.forEach((u) => u());
  }, [addError]);

  // ------------------------------------------------------------ derived data
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
  const adminRows = useMemo(() => [...admins].sort((a, b) => a.role.localeCompare(b.role) || (a.label ?? '').localeCompare(b.label ?? '')), [admins]);

  // ------------------------------------------------------------ actions
  const run = async (label: string, fn: () => Promise<unknown>) => {
    setNotice('');
    try {
      await fn();
    } catch (err: any) {
      console.error(err);
      addError(`${label}: ${err?.message ?? err}`);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('Write the 33 seed events? New ones are created; existing ones only get their copy/price/cost fields refreshed — signups, counters, status and photos are kept.')) return;
    setSeeding(true);
    await run('Seed events', async () => {
      const { created, updated } = await seedEvents();
      setNotice(`Seeded: ${created} created, ${updated} updated.`);
    });
    setSeeding(false);
  };

  const handleDelete = (e: Event) => {
    if (!window.confirm(`Delete “${e.title}”? Its sign-ups stop counting. This cannot be undone.`)) return;
    void run('Delete event', async () => {
      await deleteEvent(e.id);
      setNotice(`Deleted “${e.title}”.`);
    });
  };

  const [grantUid, setGrantUid] = useState('');
  const [grantRole, setGrantRole] = useState<AdminRole>('viewer');
  const [grantLabel, setGrantLabel] = useState('');

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault();
    const target = grantUid.trim();
    if (!target) return;
    void run('Grant admin', async () => {
      await grantAdmin(target, grantRole, grantLabel, uid);
      setNotice(`Granted ${grantRole} to ${target}.`);
      setGrantUid('');
      setGrantLabel('');
    });
  };

  const handleRevoke = (a: AdminDoc) => {
    if (!window.confirm(`Revoke ${a.label || a.uid}?`)) return;
    void run('Revoke admin', async () => {
      await revokeAdmin(a.uid);
      setNotice(`Revoked ${a.label || a.uid}.`);
    });
  };

  // ------------------------------------------------------------ exports
  const exportEvents = () =>
    downloadCsv(
      'agorax-events',
      ['id', 'title', 'category', 'price', 'minimum', 'joins', 'impressions', 'opens', 'open_to_join', 'organiser_interest', 'status'],
      eventRows.map((r) => [r.event.id, r.event.title, r.event.category, r.event.price, r.event.minParticipants, r.joins, r.impressions, r.opens, r.conversion === null ? '' : r.conversion.toFixed(3), r.interest, r.event.status]),
    );
  const exportSources = () =>
    downloadCsv('agorax-sources', ['source', 'visitors', 'joins', 'contacts'], sourceRows.map((r) => [r.source, r.visitors, r.joins, r.contacts]));
  const exportLadder = () =>
    downloadCsv(
      'agorax-price-ladder',
      ['event', 'price_asked', 'answers', 'yes', 'no', 'depends'],
      ladderRows.map((r) => [r.event.title, r.priceAsked, r.total, r.yes, r.no, r.depends]),
    );
  const exportHosting = () =>
    downloadCsv('agorax-hosting-interest', ['event', 'name', 'whatsapp', 'email', 'source', 'uid'], hostingRows.map((r) => [r.event, r.name, r.phone, r.email, r.source, r.uid]));
  const exportOffers = () =>
    downloadCsv('agorax-venue-offers', ['when', 'name', 'space', 'contact', 'source'], offerRows.map((o) => [formatTs(o.ts), o.name, o.spaceType, o.contact, o.source ?? '']));
  const exportSuggestions = () =>
    downloadCsv('agorax-suggestions', ['when', 'suggestion', 'contact', 'source'], suggestionRows.map((s) => [formatTs(s.ts), s.text, s.contact ?? '', s.source ?? '']));
  const exportAdmins = () =>
    downloadCsv('agorax-admins', ['uid', 'role', 'label', 'granted_by'], adminRows.map((a) => [a.uid, a.role, a.label ?? '', a.grantedBy ?? '']));

  const funnel = [
    { label: 'Card impressions', n: stats.impressions },
    { label: 'Card opens', n: stats.opens },
    { label: 'Joins', n: stats.totalJoins },
    { label: 'Contact submitted', n: stats.contacts },
  ];

  const statusOptions: EventStatus[] = ['Pending', 'Confirmed', 'Cancelled'];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      <header className="sticky top-0 z-30 bg-[#0f172a]/90 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-lg font-black text-white">AgoraX <span className="text-brand-secondary">admin</span></h1>
            <span className="px-2 py-0.5 rounded-md bg-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-wider">{admin.role}</span>
            {admin.label && <span className="text-xs text-slate-500">{admin.label}</span>}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <code className="text-slate-600 hidden sm:inline" title="Your uid">{uid}</code>
            <Link to="/" className="font-bold text-brand-secondary hover:text-white">Public page →</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {errors.length > 0 && (
          <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
            <p className="font-bold mb-1">Some data could not be loaded or saved:</p>
            <ul className="list-disc pl-5 space-y-0.5 break-words">
              {errors.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <p className="mt-2 text-red-300/70">Most often this means the new Firestore rules have not been published yet (see README).</p>
            <button onClick={() => setErrors([])} className="mt-2 underline font-bold">Dismiss</button>
          </div>
        )}
        {notice && <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-xs text-green-200">{notice}</div>}

        <Section title="Overview" subtitle="Live — updates as people use the site">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Tile label="Unique visitors" value={stats.visitors} hint="distinct uids in users" />
            <Tile label="Total joins" value={stats.totalJoins} />
            <Tile label="People who joined" value={stats.joiners} hint="at least one event" />
            <Tile label="Contacts captured" value={stats.contacts} hint={pct(stats.contacts, stats.visitors) + ' of visitors'} />
            <Tile label="Avg events picked" value={stats.avgPicks.toFixed(1)} hint="per person who joined" />
            <Tile label="Organiser interest" value={stats.organiserTaps} hint="“help run this” taps" />
            <Tile label="Venue offers" value={venueOffers.length} />
            <Tile label="Suggestions" value={suggestions.length} />
          </div>
        </Section>

        <Section title="Funnel" subtitle="Counters kept on each event — no analytics scan">
          <div className="glass rounded-2xl p-4 space-y-3">
            {funnel.map((step, i) => (
              <div key={step.label} className="grid grid-cols-[8rem_1fr] sm:grid-cols-[9rem_1fr_16rem] items-center gap-x-3 gap-y-1 text-xs">
                <span className="text-slate-300 font-bold">{step.label}</span>
                <Bar className="w-full" value={step.n} max={funnel[0].n || step.n || 1} color={i === 0 ? 'bg-slate-500' : 'bg-brand-secondary'} />
                <span className="col-span-2 sm:col-span-1 text-right tabular-nums text-slate-400">
                  <span className="text-white font-bold">{step.n}</span>
                  {i > 0 && <> · {pct(step.n, funnel[i - 1].n)} of prev · {pct(step.n, funnel[0].n)} of all</>}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Events"
          subtitle="Sorted by joins"
          onExport={exportEvents}
          actions={
            canEdit && (
              <>
                <button onClick={() => setEditing('new')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-brand text-white text-xs font-black">
                  <Plus size={12} /> New event
                </button>
                <button onClick={handleSeed} disabled={seeding} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs font-bold text-slate-200 hover:text-white disabled:opacity-50">
                  <Sprout size={12} /> {seeding ? 'Seeding…' : 'Seed events'}
                </button>
              </>
            )
          }
        >
          <Table
            head={['Event', 'Category', '€', 'Min', 'Joins', 'Progress', 'Impr.', 'Opens', 'Open→join', 'Host int.', 'Status', ...(canEdit ? ['Actions'] : [])]}
            empty="No events yet — use “Seed events” to add the 33."
          >
            {eventRows.map(({ event: e, joins, impressions, opens, conversion, interest }) => (
              <tr key={e.id} className={e.status === 'Cancelled' ? 'opacity-50' : ''}>
                <Td className="min-w-[12rem] text-white font-bold">
                  <span className="mr-1.5">{e.emoji ?? '🎟️'}</span>
                  {e.title}
                </Td>
                <Td>{e.category}</Td>
                <Td className="tabular-nums">{e.price === 0 ? 'Free' : e.price}</Td>
                <Td className="tabular-nums">{e.minParticipants}</Td>
                <Td className="tabular-nums text-white font-bold">{joins}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Bar value={joins} max={e.minParticipants} color={joins >= e.minParticipants ? 'bg-green-400' : 'bg-brand-secondary'} />
                    <span className="tabular-nums text-slate-500">{pct(joins, e.minParticipants)}</span>
                  </div>
                </Td>
                <Td className="tabular-nums">{impressions}</Td>
                <Td className="tabular-nums">{opens}</Td>
                <Td className="tabular-nums">{conversion === null ? '—' : `${Math.round(conversion * 100)}%`}</Td>
                <Td className="tabular-nums">{interest}</Td>
                <Td>
                  {canEdit ? (
                    <select
                      value={e.status}
                      onChange={(ev) => void run('Set status', () => setEventStatus(e.id, ev.target.value as EventStatus))}
                      className="bg-white/5 border border-white/10 rounded px-1.5 py-1 text-xs text-white"
                      aria-label={`Status of ${e.title}`}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s} className="bg-[#0f172a]">
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    e.status
                  )}
                </Td>
                {canEdit && (
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => setEditing(e)} aria-label={`Edit ${e.title}`} className="p-1.5 rounded hover:bg-white/10 text-slate-300">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(e)} aria-label={`Delete ${e.title}`} className="p-1.5 rounded hover:bg-red-500/20 text-red-300">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Td>
                )}
              </tr>
            ))}
          </Table>
        </Section>

        <Section title="Joins by source" subtitle="Which QR poster (?src=) people arrived from" onExport={exportSources}>
          <Table head={['Source', 'Visitors', 'Joins', 'Joins / visitor', 'Contacts']} empty="No visitors yet.">
            {sourceRows.map((r) => (
              <tr key={r.source}>
                <Td className="text-white font-bold">{r.source}</Td>
                <Td className="tabular-nums">{r.visitors}</Td>
                <Td className="tabular-nums">{r.joins}</Td>
                <Td className="tabular-nums">{r.visitors ? (r.joins / r.visitors).toFixed(2) : '—'}</Td>
                <Td className="tabular-nums">{r.contacts}</Td>
              </tr>
            ))}
          </Table>
        </Section>

        <Section title="Price ladder" subtitle="“Would you still come at the next price?”" onExport={exportLadder}>
          <Table head={['Event', 'Asked at €', 'Answers', 'Yes', 'No', 'Depends']} empty="No answers yet.">
            {ladderRows.map((r) => (
              <tr key={r.event.id}>
                <Td className="text-white font-bold">{r.event.title}</Td>
                <Td className="tabular-nums">{r.priceAsked}</Td>
                <Td className="tabular-nums">{r.total}</Td>
                <Td className="tabular-nums text-green-300">{pct(r.yes, r.total)}</Td>
                <Td className="tabular-nums text-red-300">{pct(r.no, r.total)}</Td>
                <Td className="tabular-nums text-amber-200">{pct(r.depends, r.total)}</Td>
              </tr>
            ))}
          </Table>
        </Section>

        <Section title="People who want to run an event" subtitle="Tapped “I'd help run this”" onExport={exportHosting}>
          <Table head={['Event', 'Name', 'WhatsApp', 'Email', 'Source']} empty="Nobody yet.">
            {hostingRows.map((r) => (
              <tr key={r.key}>
                <Td className="text-white font-bold">{r.event}</Td>
                <Td>{r.name || <span className="text-slate-600">—</span>}</Td>
                <Td>{r.phone || <span className="text-slate-600">no contact left</span>}</Td>
                <Td>{r.email || <span className="text-slate-600">—</span>}</Td>
                <Td>{r.source}</Td>
              </tr>
            ))}
          </Table>
        </Section>

        <Section title="People with a space" subtitle="“I have a space” submissions" onExport={exportOffers}>
          <Table head={['When', 'Name', 'Space', 'Contact', 'Source']} empty="No offers yet.">
            {offerRows.map((o) => (
              <tr key={o.id}>
                <Td className="whitespace-nowrap">{formatTs(o.ts)}</Td>
                <Td className="text-white font-bold">{o.name}</Td>
                <Td>{o.spaceType}</Td>
                <Td>{o.contact}</Td>
                <Td>{o.source ?? 'direct'}</Td>
              </tr>
            ))}
          </Table>
        </Section>

        <Section title="Suggestions" subtitle="“An event you'd join that isn't here?”" onExport={exportSuggestions}>
          <Table head={['When', 'Suggestion', 'Contact', 'Source']} empty="No suggestions yet.">
            {suggestionRows.map((s) => (
              <tr key={s.id}>
                <Td className="whitespace-nowrap">{formatTs(s.ts)}</Td>
                <Td className="text-white max-w-xl whitespace-pre-wrap break-words">{s.text}</Td>
                <Td>{s.contact || <span className="text-slate-600">—</span>}</Td>
                <Td>{s.source ?? 'direct'}</Td>
              </tr>
            ))}
          </Table>
        </Section>

        <Section title="Admins" subtitle={isOwner ? 'Owners can grant and revoke access' : 'Only owners can change this list'} onExport={exportAdmins}>
          <Table head={['Label', 'Role', 'uid', 'Granted by', ...(isOwner ? [''] : [])]} empty="No admins.">
            {adminRows.map((a) => (
              <tr key={a.uid}>
                <Td className="text-white font-bold">{a.label || '—'}{a.uid === uid && <span className="ml-2 text-[10px] text-brand-secondary">(you)</span>}</Td>
                <Td>{a.role}</Td>
                <Td><code className="text-[11px] break-all">{a.uid}</code></Td>
                <Td><code className="text-[11px] break-all">{a.grantedBy ?? '—'}</code></Td>
                {isOwner && (
                  <Td>
                    {a.uid !== uid && (
                      <button onClick={() => handleRevoke(a)} className="px-2 py-1 rounded text-[11px] font-bold text-red-300 hover:bg-red-500/20">
                        Revoke
                      </button>
                    )}
                  </Td>
                )}
              </tr>
            ))}
          </Table>

          {isOwner && (
            <form onSubmit={handleGrant} className="glass rounded-2xl p-4 mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] items-end">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">uid to grant</label>
                <input value={grantUid} onChange={(e) => setGrantUid(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Role</label>
                <select value={grantRole} onChange={(e) => setGrantRole(e.target.value as AdminRole)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white">
                  {(['viewer', 'editor', 'owner'] as AdminRole[]).map((r) => (
                    <option key={r} value={r} className="bg-[#0f172a]">
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Label</label>
                <input value={grantLabel} onChange={(e) => setGrantLabel(e.target.value)} placeholder="e.g. Anna" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <button type="submit" className="px-4 py-2 rounded-lg gradient-brand text-white text-xs font-black">Grant</button>
            </form>
          )}
        </Section>
      </main>

      {editing && (
        <EventEditor
          event={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => setNotice(message)}
        />
      )}
    </div>
  );
}
