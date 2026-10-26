import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell,
  Bookmark,
  Bug,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  ChevronUp,
  CircleQuestionMark,
  DoorOpen,
  FileText,
  Info,
  KeyRound,
  Inbox,
  Languages,
  LayoutGrid,
  Lightbulb,
  Lock,
  Mail,
  Map,
  Menu,
  MessageCircle,
  Plus,
  ScrollText,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  SunMoon,
  User,
  UserPlus,
  UserRoundPen,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tab, useVisitor } from '../state/VisitorProvider';
import { LOCKED_FEATURES, LockedFeature } from '../data/features';
import { CONTACT_EMAIL } from '../config/pilot';
import { useWideScreen } from '../state/useWideScreen';
import { Logo } from './Logo';
import { ProfileAvatar, displayNameOf } from './Avatar';

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

/** "Report a bug" opens an email with the questions we need answered. */
const BUG_MAIL = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('AgoraX bug report')}&body=${encodeURIComponent(
  'What went wrong?\n\nWhere did you find it (page, button)?\n\nPhone or laptop, and which browser?\n',
)}`;

/** Your profile at the bottom of the menu; it opens the personal settings. */
const ProfileCard = () => {
  const { state, actions } = useVisitor();
  const [open, setOpen] = useState(false);
  const go = (tab: Tab) => () => actions.setTab(tab);
  return (
    <div className="sheet sticky bottom-0 mt-6 rounded-sheet p-2">
      {open && (
        <div id="profile-settings" className="mb-1 space-y-0.5 border-b border-sheet-line pb-1">
          <Item icon={User} label="Profile" onClick={go('profile')} />
          <Item icon={Sparkles} label="Attend, organise or both" onClick={() => actions.openSheet('mode')} />
          <Item icon={Bell} label="Notification preferences" onClick={go('notifications')} />
          <Item icon={Shield} label="Privacy & my data" onClick={go('data')} />
          <Item icon={KeyRound} label="Account & security" onClick={go('account')} />
          <Item icon={FileText} label="Privacy notice" onClick={go('notice')} />
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="profile-settings"
        className="flex min-h-14 w-full items-center gap-3 rounded-sheet px-2 text-left hover:bg-white/5"
      >
        <ProfileAvatar size={40} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[16px] font-bold text-white">{displayNameOf(state.profile?.displayName ?? state.me?.displayName)}</span>
          <span className="block text-[13px] text-slate-300">Profile & settings</span>
        </span>
        <ChevronUp size={18} aria-hidden="true" className={`text-slate-400 transition-transform motion-reduce:transition-none ${open ? '' : 'rotate-180'}`} />
      </button>
    </div>
  );
};

/**
 * Where to go. The categories live only in the chips above the list, and personal settings only
 * in the profile card at the bottom, so nothing appears twice.
 */
export const SidebarContent = ({ onClose, closeLabel }: { onClose: () => void; closeLabel: string }) => {
  const { state, actions, meta } = useVisitor();
  const on = (tab: Tab) => !state.selected && state.tab === tab;
  const showProposals = () => {
    actions.setView('proposals');
    actions.setTab('events');
  };

  return (
    <div className="flex min-h-full flex-col px-3 pt-3 pb-3">
      <div className="flex items-center justify-between gap-3 pl-3">
        <Logo size={18} />
        <button data-autofocus onClick={onClose} aria-label={closeLabel} className="grid size-11 place-items-center rounded-sheet text-slate-300 hover:bg-white/5 hover:text-white">
          <X size={22} aria-hidden="true" />
        </button>
      </div>

      {/* Not "Main": that is the phone's bottom bar, and two landmarks shouldn't share a name. */}
      <nav aria-label="Sections" className="mt-5 space-y-0.5">
        <Item icon={LayoutGrid} label="Proposals" active={on('events') && state.view === 'proposals'} onClick={showProposals} />
        <Item icon={CalendarCheck} label="Scheduled events" active={on('events') && state.view === 'scheduled'} onClick={actions.showScheduled} />
        <Item icon={Star} label="My interests" active={on('picks')} onClick={() => actions.setTab('picks')} trailing={<Count n={meta.picks.length} />} />
        <Item icon={Bookmark} label="Saved events" active={on('saved')} onClick={() => actions.setTab('saved')} trailing={<Count n={meta.savedEvents.length} />} />
        <Item icon={Bug} label="Report a bug" href={BUG_MAIL} />
        <Item icon={Info} label="About the pilot" onClick={actions.openPilotNotice} />
      </nav>

      <details className="group mt-5">
        <summary className={`${rowClass} cursor-pointer list-none text-[13px] font-semibold text-slate-300 hover:text-white`}>
          <span className="flex-1">More</span>
          <ChevronRight size={16} aria-hidden="true" className="transition-transform group-open:rotate-90 motion-reduce:transition-none" />
        </summary>
        <div className="space-y-0.5">
          <Item icon={Plus} label="Propose an event" active={on('propose')} onClick={() => actions.editProposal(null)} />
          <Item icon={Inbox} label="My proposals" active={on('proposals')} onClick={() => actions.setTab('proposals')} trailing={<Count n={state.myProposals.length} />} />
          <Item icon={DoorOpen} label="I have a space" onClick={() => actions.openSheet('space')} />
          <Item icon={UserPlus} label="Invite friends" onClick={() => void actions.invite()} />
          {meta.organising ? (
            <Item icon={UserRoundPen} label="Organiser profile" active={on('profile')} onClick={() => actions.setTab('profile')} />
          ) : (
            <Item icon={Sparkles} label="Want to organise?" onClick={() => actions.openSheet('mode')} />
          )}
          <Item icon={Lightbulb} label="How the pilot works" active={on('how')} onClick={() => actions.setTab('how')} />
          <Item icon={CircleQuestionMark} label="FAQ" active={on('faq')} onClick={() => actions.setTab('faq')} />
          <Item icon={Mail} label="Contact" href={`mailto:${CONTACT_EMAIL}`} />
          {state.isAdmin && <Item icon={ShieldCheck} label="Admin" href="/admin" />}
        </div>
      </details>

      <details className="group mt-1">
        <summary className={`${rowClass} cursor-pointer list-none text-[13px] font-semibold text-slate-300 hover:text-white`}>
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

      <div className="flex-1" />
      <ProfileCard />
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

/** The page has been scrolled away from the very top. */
function useScrolled(): boolean {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 4);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrolled;
}

/**
 * Top left: opens the menu. On a laptop it shows only while the sidebar is hidden. On phones it is
 * smaller, and once the page scrolls it sits on a solid strip, so it never covers a card.
 */
export const MenuButton = () => {
  const { state, actions } = useVisitor();
  const wide = useWideScreen();
  const scrolled = useScrolled();
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
    <>
      {!wide && (
        <div
          aria-hidden="true"
          className={`fixed inset-x-0 top-0 z-30 h-[53px] border-b border-white/10 bg-[#171c36]/95 backdrop-blur-md transition-opacity duration-200 ${
            scrolled ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />
      )}
      <button
        ref={ref}
        onClick={actions.toggleNav}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={wide ? `${NAV_ID}-desktop` : `${NAV_ID}-drawer`}
        className={`fixed top-1.5 left-3 z-40 grid size-10 place-items-center rounded-full bg-brand-dark/90 text-white shadow-lg ring-1 ring-sheet-line hover:ring-slate-500 lg:top-2.5 lg:size-11 ${
          state.sidebarOpen ? 'lg:hidden' : ''
        }`}
      >
        <Menu size={22} aria-hidden="true" />
      </button>
    </>
  );
};
