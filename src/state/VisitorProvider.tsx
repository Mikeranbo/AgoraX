import React, { createContext, use, useEffect, useMemo, useRef, useState } from 'react';
import {
  subscribeToEvents,
  joinEvent,
  leaveEvent,
  bumpEventCounter,
  recordPriceAnswer,
  subscribeToMyUser,
  subscribeToFaces,
  subscribeIsAdmin,
  showMyInitial,
  hideMyInitial,
  setSaved,
  setPreferredTiming,
  setMode,
  Face,
} from '../services/firebaseService';
import {
  ensureAnonymousAuth,
  touchUser,
  linkContact,
  deleteMyContact,
  getSource,
  describeAuthError,
  saveDisplayName,
  setConsent,
} from '../services/identity';
import { track, AnalyticsName, statsOff, setStatsOff } from '../services/analytics';
import { once } from '../services/session';
import { subscribeMyProposals } from '../services/organiserService';
import { deletePublicProfile, savePublicProfile, subscribeProfile } from '../services/profileService';
import { deleteAllMyData, DeletionReport } from '../services/accountService';
import { nextPriceFor } from '../data/priceLadder';
import { nearestCity } from '../data/location';
import type { DateFilter } from '../data/schedule';
import { CONTACT_EMAIL, PILOT_CITY } from '../config/pilot';
import type { Event, EventCategory, PreferredTiming, PriceAnswer, Proposal, PublicProfile, UserDoc, UserMode } from '../types';
import type { ConsentPurpose } from '../data/consent';
import type { LockedFeature } from '../data/features';
import { shareCodeFor } from '../data/share';
import type { LadderPrompt } from '../components/PriceLadderSheet';
import type { ContactValues } from '../components/ContactForm';
import { LIST_ID } from '../components/ui';

/** Screens. The bottom bar shows three of them; the sidebar and account menu reach the rest. */
export type Tab =
  | 'events'
  | 'propose'
  | 'picks'
  | 'saved'
  | 'proposals'
  | 'profile'
  | 'data'
  | 'notifications'
  | 'account'
  | 'notice'
  | 'how'
  | 'faq';
export type Sheet = 'contact' | 'space' | 'initial' | 'profile' | 'locked' | 'mode' | null;
export type Filter = EventCategory | 'All';
/** Proposals are ideas without a date; scheduled events are confirmed with a real date. */
export type View = 'proposals' | 'scheduled';
export interface PlaceFilter {
  city: string;
  scope: 'all' | 'near' | 'other';
}

interface VisitorState {
  phase: 'loading' | 'ready' | 'error';
  authError: string;
  uid: string | null;
  events: Event[];
  eventsLoaded: boolean;
  eventsError: boolean;
  me: UserDoc | null;
  tab: Tab;
  /** Category shown in the event list; the sidebar sets it too. */
  filter: Filter;
  view: View;
  dateFilter: DateFilter;
  place: PlaceFilter;
  locating: boolean;
  selected: Event | null;
  isAdmin: boolean;
  /** Phone drawer. */
  drawerOpen: boolean;
  /** Laptop sidebar; remembered on this device. */
  sidebarOpen: boolean;
  accountMenuOpen: boolean;
  lockedFeature: LockedFeature | null;
  statsOff: boolean;
  pending: Set<string>;
  organiserEvent: Event | null;
  ladder: LadderPrompt | null;
  sheet: Sheet;
  /** The event the "show my initial" sheet is about. */
  initialEvent: Event | null;
  bannerDismissed: boolean;
  toast: string;
  myProposals: Proposal[];
  myProposalsLoaded: boolean;
  /** The draft open in the Propose screen, if any. */
  editing: Proposal | null;
  profile: PublicProfile | null;
}

interface VisitorActions {
  join: (e: Event) => Promise<void>;
  leave: (e: Event) => Promise<void>;
  toggleSaved: (e: Event) => Promise<void>;
  open: (e: Event) => void;
  back: () => void;
  setTab: (tab: Tab) => void;
  showCategory: (filter: Filter) => void;
  showScheduled: () => void;
  setFilter: (filter: Filter) => void;
  setView: (view: View) => void;
  setDateFilter: (filter: DateFilter) => void;
  setPlace: (place: PlaceFilter) => void;
  locateMe: () => void;
  clearFilters: () => void;
  toggleNav: () => void;
  closeNav: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setAccountMenu: (open: boolean) => void;
  openLocked: (feature: LockedFeature) => void;
  voteFeature: (feature: LockedFeature) => void;
  saveProfile: (displayName: string) => Promise<void>;
  savePublicProfile: (profile: PublicProfile) => Promise<void>;
  deletePublicProfile: () => Promise<void>;
  setMode: (mode: UserMode) => Promise<void>;
  setTiming: (timing: PreferredTiming) => Promise<void>;
  setConsent: (purpose: ConsentPurpose, on: boolean) => Promise<void>;
  setStatsOff: (off: boolean) => void;
  hideAllInitials: () => Promise<void>;
  invite: () => Promise<void>;
  helpRun: (e: Event) => void;
  closeOrganiser: () => void;
  answerLadder: (prompt: LadderPrompt, answer: PriceAnswer) => void;
  skipLadder: () => void;
  openSheet: (sheet: Exclude<Sheet, null | 'initial' | 'locked'> | 'privacy') => void;
  askInitial: (e: Event) => void;
  showInitial: (e: Event, initial: string) => Promise<void>;
  hideInitial: (e: Event) => Promise<void>;
  closeSheet: () => void;
  submitContact: (values: ContactValues) => Promise<void>;
  deleteContact: () => Promise<void>;
  deleteEverything: () => Promise<DeletionReport>;
  editProposal: (p: Proposal | null) => void;
  dismissBanner: () => void;
  showToast: (message: string) => void;
}

interface VisitorMeta {
  joined: Set<string>;
  picks: Event[];
  saved: Set<string>;
  savedEvents: Event[];
  /** Initials shown on each event's list, by event id. */
  faces: Map<string, Face[]>;
  /** Organiser tools are on (Organise or Both). */
  organising: boolean;
}

const VisitorContext = createContext<{ state: VisitorState; actions: VisitorActions; meta: VisitorMeta } | null>(null);

export function useVisitor() {
  const ctx = use(VisitorContext);
  if (!ctx) throw new Error('useVisitor must be used inside <VisitorProvider>');
  return ctx;
}

const BANNER_KEY = 'agorax_banner_dismissed';
const SIDEBAR_KEY = 'agorax_sidebar';
const CITY_KEY = 'agorax_city';
let pageViewSent = false;

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeString(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: the choice lasts for this visit */
  }
}

function urlEventId(): string | null {
  return new URLSearchParams(window.location.search).get('e');
}

/** The laptop layout: the sidebar sits beside the page instead of over it. */
export const isWideScreen = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

const DEFAULT_PLACE = (): PlaceFilter => ({ city: readString(CITY_KEY) || PILOT_CITY, scope: 'all' });

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
  const [filter, setFilter] = useState<Filter>('All');
  const [view, setView] = useState<View>('proposals');
  const [dateFilter, setDateFilter] = useState<DateFilter>('any');
  const [place, setPlaceState] = useState<PlaceFilter>(DEFAULT_PLACE);
  const [locating, setLocating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => readString(SIDEBAR_KEY) !== '0');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<LockedFeature | null>(null);
  const [statsAreOff, setStatsAreOff] = useState(statsOff);
  const [selectedId, setSelectedId] = useState<string | null>(urlEventId);
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [organiserEvent, setOrganiserEvent] = useState<Event | null>(null);
  const [ladder, setLadder] = useState<LadderPrompt | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [initialEvent, setInitialEvent] = useState<Event | null>(null);
  const [faces, setFaces] = useState<Map<string, Face[]>>(() => new Map());
  const [bannerDismissed, setBannerDismissed] = useState(() => readFlag(BANNER_KEY));
  const [toast, setToast] = useState('');
  const [myProposals, setMyProposals] = useState<Proposal[]>([]);
  const [myProposalsLoaded, setMyProposalsLoaded] = useState(false);
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);

  const scrollBeforeOpen = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // No sign-in screen, ever: get an anonymous user first, then subscribe.
  useEffect(() => {
    let cancelled = false;
    const unsubscribers: Array<() => void> = [];
    document.title = 'AgoraX · Help choose which events happen next';

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
        unsubscribers.push(subscribeToFaces(setFaces));
        unsubscribers.push(subscribeIsAdmin(user.uid, setIsAdmin));
        unsubscribers.push(
          subscribeMyProposals(
            user.uid,
            (list) => {
              setMyProposals(list);
              setMyProposalsLoaded(true);
            },
            (err) => {
              console.warn('my proposals', err);
              setMyProposalsLoaded(true);
            },
          ),
        );
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

  // The public profile, once the person has one.
  const publicId = me?.publicId;
  useEffect(() => {
    if (!publicId) {
      setProfile(null);
      return;
    }
    return subscribeProfile(publicId, setProfile, (err) => console.warn('profile', err));
  }, [publicId]);

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
  const saved = useMemo(() => new Set(me?.savedEvents ?? []), [me]);
  const picks = useMemo(() => events.filter((e) => joined.has(e.id) && e.status !== 'Cancelled'), [events, joined]);
  const savedEvents = useMemo(() => events.filter((e) => saved.has(e.id) && e.status !== 'Cancelled'), [events, saved]);
  const selected = selectedId ? events.find((e) => e.id === selectedId) ?? null : null;
  const organising = me?.mode === 'organise' || me?.mode === 'both';

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
  const saveFailed = () => showToast("That didn't save. Check your connection and try again.");

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
        saveFailed();
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
        saveFailed();
      } finally {
        setBusy(event.id, false);
      }
    },
    toggleSaved: async (event) => {
      if (!uid) return;
      const on = !saved.has(event.id);
      try {
        await setSaved(uid, event.id, on);
        showToast(on ? 'Saved. Find it under Saved events.' : 'Removed from Saved events.');
      } catch (err) {
        console.error(err);
        saveFailed();
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
      setDrawerOpen(false);
      setAccountMenuOpen(false);
      setTabState(next);
      // The opening view is for arriving on the site; from the menus, go straight to the list.
      setTimeout(() => {
        const list = next === 'events' ? document.getElementById(LIST_ID) : null;
        if (list) list.scrollIntoView();
        else window.scrollTo(0, 0);
      }, 0);
    },
    showCategory: (next) => {
      setFilter(next);
      setView('proposals');
      actions.setTab('events');
    },
    showScheduled: () => {
      setView('scheduled');
      actions.setTab('events');
    },
    setFilter,
    setView: (next) => {
      setView(next);
      if (next === 'proposals') setDateFilter('any');
    },
    setDateFilter,
    setPlace: (next) => {
      setPlaceState(next);
      writeString(CITY_KEY, next.city);
    },
    locateMe: () => {
      // Asked only when the person taps "Use my location". The position is matched to the
      // nearest listed city and then dropped: nothing but the city name is kept.
      if (!('geolocation' in navigator)) {
        showToast("This browser can't share a location. Pick a city instead.");
        return;
      }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          const city = nearestCity(pos.coords.latitude, pos.coords.longitude);
          if (!city) {
            showToast("You're not near any city on our list. Pick one instead.");
            return;
          }
          actions.setPlace({ city, scope: 'near' });
          showToast(`Showing events near ${city}.`);
        },
        () => {
          setLocating(false);
          showToast("Couldn't get your location. Pick a city instead.");
        },
        { enableHighAccuracy: false, maximumAge: 600_000, timeout: 10_000 },
      );
    },
    clearFilters: () => {
      setFilter('All');
      setDateFilter('any');
      setPlaceState((p) => ({ ...p, scope: 'all' }));
    },
    toggleNav: () => {
      if (isWideScreen()) {
        setSidebarOpen((open) => {
          writeString(SIDEBAR_KEY, open ? '0' : '1');
          return !open;
        });
      } else {
        setDrawerOpen((open) => !open);
      }
    },
    closeNav: () => {
      if (isWideScreen()) {
        setSidebarOpen(false);
        writeString(SIDEBAR_KEY, '0');
      } else {
        setDrawerOpen(false);
      }
    },
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    setAccountMenu: setAccountMenuOpen,
    openLocked: (feature) => {
      track('locked_feature_click', { feature });
      setLockedFeature(feature);
      setDrawerOpen(false);
      setSheet('locked');
    },
    voteFeature: (feature) => {
      // One vote per feature per visit; /admin also counts each person once.
      if (once(`vote:${feature}`)) track('feature_vote', { feature });
      setSheet(null);
      showToast("Noted. We'll build the most wanted ones first.");
    },
    saveProfile: async (displayName) => {
      await saveDisplayName(displayName);
      setSheet(null);
    },
    savePublicProfile: async (next) => {
      await savePublicProfile(me?.publicId, next);
    },
    deletePublicProfile: async () => {
      if (!me?.publicId) return;
      await deletePublicProfile(me.publicId);
      showToast('Your public profile is deleted.');
    },
    setMode: async (mode) => {
      if (!uid) return;
      try {
        await setMode(uid, mode);
        setSheet(null);
      } catch (err) {
        console.error(err);
        saveFailed();
      }
    },
    setTiming: async (timing) => {
      if (!uid) return;
      try {
        await setPreferredTiming(uid, timing);
      } catch (err) {
        console.error(err);
        saveFailed();
      }
    },
    setConsent: async (purpose, on) => {
      try {
        await setConsent(purpose, on);
      } catch (err) {
        console.error(err);
        saveFailed();
      }
    },
    setStatsOff: (off) => {
      setStatsOff(off);
      setStatsAreOff(off);
    },
    hideAllInitials: async () => {
      if (!uid) return;
      const mine = [...faces.values()].flat().filter((f) => f.uid === uid);
      await Promise.all(mine.map((f) => hideMyInitial(f.eventId, uid)));
    },
    invite: async () => {
      const code = me?.shareCode ?? (uid ? shareCodeFor(uid) : '');
      const url = `${window.location.origin}/?ref=${encodeURIComponent(code)}`;
      track('invite_click');
      try {
        if (navigator.share) {
          await navigator.share({ title: 'AgoraX', text: 'Help choose which events happen next in Groningen.', url });
          return;
        }
        await navigator.clipboard.writeText(url);
        showToast('Invite link copied.');
      } catch {
        /* the share sheet was closed */
      }
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
    openSheet: (next) => {
      setDrawerOpen(false);
      setAccountMenuOpen(false);
      // The privacy notice is a full page now; older links still ask for the "privacy" sheet.
      if (next === 'privacy') {
        actions.setTab('notice');
        return;
      }
      setSheet(next);
    },
    askInitial: (event) => {
      setInitialEvent(event);
      setSheet('initial');
    },
    showInitial: async (event, initial) => {
      if (!uid) return;
      await showMyInitial(event.id, uid, initial);
      setSheet(null);
    },
    hideInitial: async (event) => {
      if (!uid) return;
      try {
        await hideMyInitial(event.id, uid);
      } catch (err) {
        console.error(err);
        saveFailed();
      }
    },
    closeSheet: () => setSheet(null),
    submitContact: async (values) => {
      await linkContact({ phone: values.phone, email: values.email, purpose: 'updates', alsoConsent: values.alsoConsent });
      track('contact_submit', { via: 'banner', hasPhone: values.phone !== '', hasEmail: values.email !== '' });
      setSheet(null);
    },
    deleteContact: async () => {
      try {
        await deleteMyContact();
        if (uid) {
          const mine = [...faces.values()].flat().filter((f) => f.uid === uid);
          await Promise.all(mine.map((f) => hideMyInitial(f.eventId, uid)));
        }
        showToast('Your contact details are deleted.');
      } catch (err) {
        console.error(err);
        showToast(`That didn't work. Email ${CONTACT_EMAIL} and we'll delete them by hand.`);
      }
    },
    deleteEverything: () => deleteAllMyData(events.map((e) => e.id)),
    editProposal: (p) => {
      setEditing(p);
      actions.setTab('propose');
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
    filter,
    view,
    dateFilter,
    place,
    locating,
    selected,
    isAdmin,
    drawerOpen,
    sidebarOpen,
    accountMenuOpen,
    lockedFeature,
    statsOff: statsAreOff,
    pending,
    organiserEvent,
    ladder,
    sheet,
    initialEvent,
    bannerDismissed,
    toast,
    myProposals,
    myProposalsLoaded,
    editing,
    profile,
  };

  return (
    <VisitorContext value={{ state, actions, meta: { joined, picks, saved, savedEvents, faces, organising } }}>{children}</VisitorContext>
  );
}
