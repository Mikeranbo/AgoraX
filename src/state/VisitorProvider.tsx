import React, { createContext, use, useEffect, useMemo, useRef, useState } from 'react';
import {
  subscribeToEvents,
  joinEvent,
  leaveEvent,
  bumpEventCounter,
  recordPriceAnswer,
  subscribeToMyUser,
} from '../services/firebaseService';
import { ensureAnonymousAuth, touchUser, linkContact, deleteMyContact, getSource, describeAuthError } from '../services/identity';
import { track, AnalyticsName } from '../services/analytics';
import { once } from '../services/session';
import { nextPriceFor } from '../data/priceLadder';
import type { Event, PriceAnswer, UserDoc } from '../types';
import type { LadderPrompt } from '../components/PriceLadderSheet';
import type { ContactValues } from '../components/ContactForm';

export type Tab = 'events' | 'propose' | 'picks';
export type Sheet = 'contact' | 'space' | 'privacy' | null;

interface VisitorState {
  phase: 'loading' | 'ready' | 'error';
  authError: string;
  uid: string | null;
  events: Event[];
  eventsLoaded: boolean;
  eventsError: boolean;
  me: UserDoc | null;
  tab: Tab;
  selected: Event | null;
  pending: Set<string>;
  organiserEvent: Event | null;
  ladder: LadderPrompt | null;
  sheet: Sheet;
  bannerDismissed: boolean;
  toast: string;
}

interface VisitorActions {
  join: (e: Event) => Promise<void>;
  leave: (e: Event) => Promise<void>;
  open: (e: Event) => void;
  back: () => void;
  setTab: (tab: Tab) => void;
  helpRun: (e: Event) => void;
  closeOrganiser: () => void;
  answerLadder: (prompt: LadderPrompt, answer: PriceAnswer) => void;
  skipLadder: () => void;
  openSheet: (sheet: Exclude<Sheet, null>) => void;
  closeSheet: () => void;
  submitContact: (values: ContactValues) => Promise<void>;
  deleteContact: () => Promise<void>;
  dismissBanner: () => void;
  showToast: (message: string) => void;
}

interface VisitorMeta {
  joined: Set<string>;
  picks: Event[];
}

const VisitorContext = createContext<{ state: VisitorState; actions: VisitorActions; meta: VisitorMeta } | null>(null);

export function useVisitor() {
  const ctx = use(VisitorContext);
  if (!ctx) throw new Error('useVisitor must be used inside <VisitorProvider>');
  return ctx;
}

const BANNER_KEY = 'agorax_banner_dismissed';
let pageViewSent = false;

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function urlEventId(): string | null {
  return new URLSearchParams(window.location.search).get('e');
}

/** The only place that knows how the public site talks to Firebase. Screens read state and call actions. */
export function VisitorProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<VisitorState['phase']>('loading');
  const [authError, setAuthError] = useState('');
  const [uid, setUid] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [eventsError, setEventsError] = useState(false);
  const [me, setMe] = useState<UserDoc | null>(null);
  const [tab, setTabState] = useState<Tab>('events');
  const [selectedId, setSelectedId] = useState<string | null>(urlEventId);
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [organiserEvent, setOrganiserEvent] = useState<Event | null>(null);
  const [ladder, setLadder] = useState<LadderPrompt | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [bannerDismissed, setBannerDismissed] = useState(() => readFlag(BANNER_KEY));
  const [toast, setToast] = useState('');

  const scrollBeforeOpen = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // No sign-in screen, ever: get an anonymous user first, then subscribe.
  useEffect(() => {
    let cancelled = false;
    const unsubscribers: Array<() => void> = [];
    document.title = 'AgoraX · What would you actually go to?';

    ensureAnonymousAuth()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        setPhase('ready');
        void touchUser();
        if (!pageViewSent) {
          pageViewSent = true;
          track('page_view', { path: window.location.pathname });
        }
        unsubscribers.push(
          subscribeToEvents(
            (list) => {
              setEvents(list);
              setEventsLoaded(true);
              setEventsError(false);
            },
            () => {
              setEventsLoaded(true);
              setEventsError(true);
            },
          ),
        );
        unsubscribers.push(subscribeToMyUser(user.uid, setMe));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setAuthError(describeAuthError(err));
        setPhase('error');
      });

    return () => {
      cancelled = true;
      unsubscribers.forEach((u) => u());
    };
  }, []);

  // The phone's back button closes an open event instead of leaving the site.
  useEffect(() => {
    const onPop = () => setSelectedId(urlEventId());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // scroll_depth_25/50/75/100 on the event list, each once per session.
  useEffect(() => {
    if (phase !== 'ready' || selectedId || tab !== 'events') return;
    const onScroll = () => {
      const el = document.documentElement;
      const scrollable = el.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = (window.scrollY / scrollable) * 100;
      const atBottom = window.scrollY + window.innerHeight >= el.scrollHeight - 4;
      for (const mark of [25, 50, 75, 100] as const) {
        const reached = mark === 100 ? atBottom : pct >= mark;
        if (reached && once(`scroll:${mark}`)) track(`scroll_depth_${mark}` as AnalyticsName);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [phase, selectedId, tab]);

  const joined = useMemo(() => new Set(me?.joinedEvents ?? []), [me]);
  const picks = useMemo(() => events.filter((e) => joined.has(e.id) && e.status !== 'Cancelled'), [events, joined]);
  const selected = selectedId ? events.find((e) => e.id === selectedId) ?? null : null;

  // A shared link (?e=…) opens on its event; count that as an open once the event is known.
  useEffect(() => {
    if (selected && once(`open:${selected.id}`)) {
      void bumpEventCounter(selected.id, 'opens');
      track('card_open', { eventId: selected.id });
    }
  }, [selected?.id]);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4000);
  };

  const setBusy = (eventId: string, on: boolean) =>
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(eventId);
      else next.delete(eventId);
      return next;
    });

  const actions: VisitorActions = {
    join: async (event) => {
      if (!uid || pending.has(event.id) || joined.has(event.id)) return;
      const joinsBefore = joined.size;
      track('join_click', { eventId: event.id, price: event.price });
      setBusy(event.id, true);
      try {
        const created = await joinEvent(event.id, uid, { priceSeen: event.price, source: getSource() });
        // Price question: on the first join, then every third. Never blocks the join.
        if (created && joinsBefore % 3 === 0 && !me?.priceAnswers?.[event.id]) {
          setLadder({ event, nextPrice: nextPriceFor(event) });
        }
      } catch (err) {
        console.error(err);
        showToast("That didn't save. Check your connection and try again.");
      } finally {
        setBusy(event.id, false);
      }
    },
    leave: async (event) => {
      if (!uid || pending.has(event.id)) return;
      track('leave_click', { eventId: event.id });
      setBusy(event.id, true);
      try {
        await leaveEvent(event.id, uid);
      } catch (err) {
        console.error(err);
        showToast("That didn't save. Check your connection and try again.");
      } finally {
        setBusy(event.id, false);
      }
    },
    open: (event) => {
      scrollBeforeOpen.current = window.scrollY;
      const url = new URL(window.location.href);
      url.searchParams.set('e', event.id);
      window.history.pushState({ e: event.id }, '', url);
      setSelectedId(event.id);
      window.scrollTo(0, 0);
    },
    back: () => {
      if (window.history.state?.e) {
        window.history.back();
      } else {
        const url = new URL(window.location.href);
        url.searchParams.delete('e');
        window.history.replaceState(null, '', url);
        setSelectedId(null);
      }
      requestAnimationFrame(() => window.scrollTo(0, scrollBeforeOpen.current));
    },
    setTab: (next) => {
      if (selectedId) actions.back();
      setTabState(next);
      window.scrollTo(0, 0);
    },
    helpRun: (event) => {
      setOrganiserEvent(event);
      track('organiser_panel_open', { eventId: event.id });
    },
    closeOrganiser: () => setOrganiserEvent(null),
    answerLadder: (prompt, answer) => {
      setLadder(null);
      if (!uid) return;
      track('price_ladder_answer', {
        eventId: prompt.event.id,
        answer,
        priceAsked: prompt.nextPrice,
        priceSeen: prompt.event.price,
      });
      recordPriceAnswer(uid, prompt.event.id, prompt.event.price, prompt.nextPrice, answer).catch((err) =>
        console.warn('price answer not saved', err),
      );
    },
    skipLadder: () => setLadder(null),
    openSheet: (next) => setSheet(next),
    closeSheet: () => setSheet(null),
    submitContact: async (values) => {
      await linkContact({ phone: values.phone, email: values.email, purpose: 'updates' });
      track('contact_submit', { via: 'banner', hasPhone: values.phone !== '', hasEmail: values.email !== '' });
      setSheet(null);
    },
    deleteContact: async () => {
      try {
        await deleteMyContact();
        showToast('Your contact details are deleted.');
      } catch (err) {
        console.error(err);
        showToast("That didn't work. Email sondarevn@gmail.com and we'll delete them by hand.");
      }
    },
    dismissBanner: () => {
      setBannerDismissed(true);
      try {
        localStorage.setItem(BANNER_KEY, '1');
      } catch {
        /* the banner just comes back next visit */
      }
    },
    showToast,
  };

  const state: VisitorState = {
    phase,
    authError,
    uid,
    events,
    eventsLoaded,
    eventsError,
    me,
    tab,
    selected,
    pending,
    organiserEvent,
    ladder,
    sheet,
    bannerDismissed,
    toast,
  };

  return <VisitorContext value={{ state, actions, meta: { joined, picks } }}>{children}</VisitorContext>;
}
