import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  Bookmark,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  CircleQuestionMark,
  Cpu,
  Dices,
  DoorOpen,
  Dumbbell,
  FilePen,
  FileText,
  Inbox,
  Languages,
  LayoutGrid,
  Lightbulb,
  Lock,
  Mail,
  Map,
  Menu,
  MessageCircle,
  Palette,
  PartyPopper,
  Plus,
  ScrollText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  SunMoon,
  Trees,
  UserPlus,
  UserRoundPen,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EventCategory, PUBLIC_CATEGORIES } from '../types';
import { Tab, useVisitor } from '../state/VisitorProvider';
import { LOCKED_FEATURES, LockedFeature } from '../data/features';
import { CONTACT_EMAIL } from '../config/pilot';
import { useWideScreen } from '../state/useWideScreen';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Sports: Dumbbell,
  Games: Dices,
  Creative: Palette,
  Social: PartyPopper,
  Study: BookOpen,
  'Tech & Ideas': Cpu,
  Outdoor: Trees,
};

export const NAV_ID = 'site-menu';
const rowClass = 'flex min-h-11 w-full items-center gap-3 rounded-sheet px-3 text-left text-[15px]';

/** A working item: highlights when it is the current screen. */
const Item = ({ icon: Icon, label, active, onClick, href, trailing }: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  trailing?: React.ReactNode;
}) => {
  const className = `${rowClass} ${active ? 'bg-brand-action/25 font-semibold text-white' : 'text-slate-200 hover:bg-white/5 hover:text-white'}`;
  const body = (
    <>
      <Icon size={18} aria-hidden="true" className={active ? 'text-brand-secondary' : 'text-slate-400'} />
      <span className="flex-1">{label}</span>
      {trailing}
    </>
  );
  if (href) return <a href={href} className={className}>{body}</a>;
  return (
    <button onClick={onClick} aria-current={active ? 'page' : undefined} className={className}>{body}</button>
  );
};

const Count = ({ n }: { n: number }) => (n > 0 ? <span className="text-[13px] text-slate-300 tabular-nums">{n}</span> : null);

/** Not built yet: muted, with a lock. Tapping it asks whether you want it (votes rank them on /admin). */
const Locked = ({ icon: Icon, feature }: { icon: LucideIcon; feature: LockedFeature }) => {
  const { actions } = useVisitor();
  return (
    <button onClick={() => actions.openLocked(feature)} className={`${rowClass} text-slate-400 hover:bg-white/5`}>
      <Icon size={18} aria-hidden="true" />
      <span className="flex-1">{LOCKED_FEATURES[feature]}</span>
      <Lock size={12} aria-label="not available yet" />
    </button>
  );
};

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-5">
    <h2 className="mb-1 px-3 text-[13px] font-semibold text-slate-400">{title}</h2>
    <div className="space-y-0.5">{children}</div>
  </section>
);

/**
 * Where to go: proposals, your own lists, requests and (for organisers) organiser tools.
 * Personal settings live in the account menu instead, so nothing appears twice.
 */
export const SidebarContent = ({ onClose, closeLabel }: { onClose: () => void; closeLabel: string }) => {
  const { state, actions, meta } = useVisitor();
  const on = (tab: Tab) => !state.selected && state.tab === tab;
  const onCategory = (c: EventCategory | 'All') => on('events') && state.view === 'proposals' && state.filter === c;
  const closeRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="px-3 pt-3 pb-10">
      <div className="flex items-center justify-between gap-3 pl-3">
        <p className="font-display text-[17px] font-extrabold tracking-tight text-white">
          Agora<span className="text-brand-secondary">X</span> <span className="font-sans text-[13px] font-semibold text-slate-300">pilot</span>
        </p>
        <button ref={closeRef} data-autofocus onClick={onClose} aria-label={closeLabel} className="grid size-11 place-items-center rounded-sheet text-slate-300 hover:bg-white/5 hover:text-white">
          <X size={22} aria-hidden="true" />
        </button>
      </div>

      <Group title="Discover">
        <Item icon={LayoutGrid} label="All proposals" active={onCategory('All')} onClick={() => actions.showCategory('All')} />
        {PUBLIC_CATEGORIES.map((c) => (
          <Item key={c} icon={CATEGORY_ICONS[c] ?? LayoutGrid} label={c} active={onCategory(c)} onClick={() => actions.showCategory(c)} />
        ))}
        <Item icon={CalendarCheck} label="Scheduled events" active={on('events') && state.view === 'scheduled'} onClick={actions.showScheduled} />
      </Group>

      <Group title="Mine">
        <Item icon={Star} label="My interests" active={on('picks')} onClick={() => actions.setTab('picks')} trailing={<Count n={meta.picks.length} />} />
        <Item icon={Bookmark} label="Saved events" active={on('saved')} onClick={() => actions.setTab('saved')} trailing={<Count n={meta.savedEvents.length} />} />
      </Group>

      <Group title="Requests">
        <Item icon={Plus} label="Propose an event" active={on('propose')} onClick={() => actions.editProposal(null)} />
        <Item icon={Inbox} label="My proposals" active={on('proposals')} onClick={() => actions.setTab('proposals')} trailing={<Count n={state.myProposals.length} />} />
        <Item icon={DoorOpen} label="I have a space" onClick={() => actions.openSheet('space')} />
        <Item icon={UserPlus} label="Invite friends" onClick={() => void actions.invite()} />
        {!meta.organising && <Item icon={Sparkles} label="Want to organise?" onClick={() => actions.openSheet('mode')} />}
      </Group>

      {meta.organising && (
        <Group title="Organiser tools">
          <Item icon={FilePen} label="New draft" onClick={() => actions.editProposal(null)} />
          <Item icon={UserRoundPen} label="Organiser profile" active={on('profile')} onClick={() => actions.setTab('profile')} />
        </Group>
      )}

      <Group title="Help">
        <Item icon={Lightbulb} label="How the pilot works" active={on('how')} onClick={() => actions.setTab('how')} />
        <Item icon={CircleQuestionMark} label="FAQ" active={on('faq')} onClick={() => actions.setTab('faq')} />
        <Item icon={FileText} label="Privacy notice" active={on('notice')} onClick={() => actions.setTab('notice')} />
        <Item icon={Mail} label="Contact" href={`mailto:${CONTACT_EMAIL}`} />
      </Group>

      <details className="group mt-5">
        <summary className={`${rowClass} cursor-pointer list-none text-[13px] font-semibold text-slate-400 hover:text-white`}>
          <span className="flex-1">Ideas we're considering</span>
          <ChevronRight size={16} aria-hidden="true" className="transition-transform group-open:rotate-90 motion-reduce:transition-none" />
        </summary>
        <div className="space-y-0.5">
          <Locked icon={Users} feature="friends" />
          <Locked icon={MessageCircle} feature="messages" />
          <Locked icon={UsersRound} feature="communities" />
          <Locked icon={Map} feature="map" />
          <Locked icon={CalendarDays} feature="calendar" />
          <Locked icon={Building2} feature="cities" />
          <Locked icon={Languages} feature="dutch" />
          <Locked icon={SunMoon} feature="appearance" />
          <Locked icon={Smartphone} feature="devices" />
          <Locked icon={ScrollText} feature="terms" />
        </div>
      </details>

      {state.isAdmin && (
        <Group title="Admin">
          <Item icon={ShieldCheck} label="Admin" href="/admin" />
        </Group>
      )}
    </div>
  );
};

/** Laptop: beside the page while open; fully hidden (no reserved width) while closed. */
export const DesktopSidebar = () => {
  const { state, actions } = useVisitor();
  const panel = useRef<HTMLElement>(null);
  const wasOpen = useRef(state.sidebarOpen);
  // Opening it from the menu button moves focus into it; the first render never steals focus.
  useEffect(() => {
    if (state.sidebarOpen && !wasOpen.current) panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    wasOpen.current = state.sidebarOpen;
  }, [state.sidebarOpen]);
  return (
    <aside
      ref={panel}
      id={`${NAV_ID}-desktop`}
      aria-label="Menu"
      hidden={!state.sidebarOpen}
      className="sheet fixed inset-y-0 left-0 z-40 w-80 overflow-y-auto rounded-none border-y-0 border-l-0 max-lg:hidden"
    >
      <SidebarContent onClose={actions.closeNav} closeLabel="Hide menu" />
    </aside>
  );
};

/** Phone: the same menu as an overlay drawer. Escape, a tap outside or a choice closes it. */
export const SidebarDrawer = () => {
  const { state, actions } = useVisitor();
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!state.drawerOpen) return;
    // Move focus into the drawer as soon as it is mounted (also with reduced motion).
    const focusTimer = setTimeout(() => panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') actions.closeDrawer();
      // Keep Tab inside the drawer while it is open.
      if (e.key === 'Tab' && panel.current) {
        const items = panel.current.querySelectorAll<HTMLElement>('button, a[href], summary');
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKey);
    };
  }, [state.drawerOpen]);

  return (
    <AnimatePresence>
      {state.drawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={actions.closeDrawer}
            data-testid="drawer-backdrop"
            className="fixed inset-0 z-[60] bg-brand-dark/80 lg:hidden"
          />
          <motion.aside
            ref={panel}
            id={`${NAV_ID}-drawer`}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="sheet fixed inset-y-0 left-0 z-[70] w-[min(86vw,320px)] overflow-y-auto rounded-none border-y-0 border-l-0 lg:hidden"
          >
            <SidebarContent onClose={actions.closeDrawer} closeLabel="Close menu" />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

/** Top left: opens the menu. On a laptop it shows only while the sidebar is hidden. */
export const MenuButton = () => {
  const { state, actions } = useVisitor();
  const wide = useWideScreen();
  const ref = useRef<HTMLButtonElement>(null);
  const open = wide ? state.sidebarOpen : state.drawerOpen;
  const wasOpen = useRef(open);

  // Closing the menu gives focus back to the button that opened it.
  useEffect(() => {
    if (wasOpen.current && !open) ref.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  if (state.selected) return null;
  return (
    <button
      ref={ref}
      onClick={actions.toggleNav}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      aria-controls={wide ? `${NAV_ID}-desktop` : `${NAV_ID}-drawer`}
      className={`fixed top-2.5 left-3 z-40 grid size-11 place-items-center rounded-full bg-brand-dark/90 text-white shadow-lg ring-1 ring-sheet-line hover:ring-slate-500 ${
        state.sidebarOpen ? 'lg:hidden' : ''
      }`}
    >
      <Menu size={22} aria-hidden="true" />
    </button>
  );
};
