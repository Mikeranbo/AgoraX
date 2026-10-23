import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell,
  BookOpen,
  Bookmark,
  Building2,
  CalendarDays,
  Check,
  CircleQuestionMark,
  Cpu,
  Dices,
  DoorOpen,
  Dumbbell,
  FileText,
  Handshake,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  Lightbulb,
  Lock,
  Mail,
  Map,
  MapPin,
  MessageCircle,
  Palette,
  PartyPopper,
  Plus,
  ScrollText,
  Shield,
  ShieldCheck,
  Smartphone,
  Star,
  SunMoon,
  Ticket,
  Trees,
  User,
  UserPlus,
  Users,
  UsersRound,
  Wallet,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EventCategory, PUBLIC_CATEGORIES } from '../types';
import { Tab, useVisitor } from '../state/VisitorProvider';
import { LOCKED_FEATURES, LockedFeature } from '../data/features';
import { ProfileAvatar, displayNameOf } from './Avatar';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Sports: Dumbbell,
  Games: Dices,
  Creative: Palette,
  Social: PartyPopper,
  Study: BookOpen,
  'Tech & Ideas': Cpu,
  Outdoor: Trees,
};

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
  if (!onClick) return <div className={className}>{body}</div>;
  return (
    <button onClick={onClick} aria-current={active ? 'page' : undefined} className={className}>{body}</button>
  );
};

/** Not built yet: muted, with a lock. Tapping it asks whether you want it. */
const Locked = ({ icon: Icon, feature }: { icon: LucideIcon; feature: LockedFeature }) => {
  const { actions } = useVisitor();
  return (
    <button onClick={() => actions.openLocked(feature)} className={`${rowClass} text-slate-400 hover:bg-white/5`}>
      <Icon size={18} aria-hidden="true" />
      <span className="flex-1">{LOCKED_FEATURES[feature]}</span>
      <span className="flex items-center gap-1 text-[12px]">
        <Lock size={12} aria-hidden="true" /> Coming soon
      </span>
    </button>
  );
};

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-5">
    <h2 className="mb-1 px-3 text-[13px] font-semibold text-slate-400">{title}</h2>
    <div className="space-y-0.5">{children}</div>
  </section>
);

const ChosenMark = () => <Check size={16} aria-label="current" className="text-brand-secondary" />;

/** Everything a visitor can reach, built or coming. Used as the laptop sidebar and the phone drawer. */
export const SidebarContent = () => {
  const { state, actions, meta } = useVisitor();
  const on = (tab: Tab) => !state.selected && state.tab === tab;
  const onCategory = (c: EventCategory | 'All') => on('events') && state.filter === c;

  return (
    <div className="px-3 pt-5 pb-10">
      <div className="flex items-center gap-3 px-3">
        <ProfileAvatar size={48} />
        <div className="min-w-0">
          <p className="truncate font-display text-[19px] font-bold text-white">{displayNameOf(state.me?.displayName)}</p>
          <button onClick={() => actions.openSheet('profile')} className="text-[14px] font-semibold text-brand-secondary underline underline-offset-4">
            Edit profile
          </button>
        </div>
      </div>

      <Group title="Me">
        <Item icon={User} label="My profile" active={on('profile')} onClick={() => actions.setTab('profile')} />
        <Item
          icon={Star}
          label="My picks"
          active={on('picks')}
          onClick={() => actions.setTab('picks')}
          trailing={meta.picks.length > 0 && <span className="text-[13px] text-slate-300 tabular-nums">{meta.picks.length}</span>}
        />
        <Locked icon={Handshake} feature="helping" />
        <Locked icon={Bookmark} feature="saved" />
        <Locked icon={Ticket} feature="tickets" />
        <Locked icon={Wallet} feature="earnings" />
      </Group>

      <Group title="Social">
        <Item icon={UserPlus} label="Invite friends" onClick={() => void actions.invite()} />
        <Locked icon={Users} feature="friends" />
        <Locked icon={MessageCircle} feature="messages" />
        <Locked icon={UsersRound} feature="communities" />
      </Group>

      <Group title="Discover">
        <Item icon={LayoutGrid} label="All events" active={onCategory('All')} onClick={() => actions.showCategory('All')} />
        {PUBLIC_CATEGORIES.map((c) => (
          <Item key={c} icon={CATEGORY_ICONS[c] ?? LayoutGrid} label={c} active={onCategory(c)} onClick={() => actions.showCategory(c)} />
        ))}
        <Locked icon={Map} feature="map" />
        <Locked icon={CalendarDays} feature="calendar" />
        <Item icon={MapPin} label="City: Groningen" trailing={<ChosenMark />} onClick={() => actions.showCategory('All')} />
        <Locked icon={Building2} feature="cities" />
      </Group>

      <Group title="Create">
        <Item icon={Plus} label="Propose an event" active={on('propose')} onClick={() => actions.setTab('propose')} />
        <Item icon={DoorOpen} label="I have a space" onClick={() => actions.openSheet('space')} />
        <Locked icon={LayoutDashboard} feature="host-dashboard" />
      </Group>

      <Group title="Settings">
        <Item icon={Shield} label="Privacy & my data" active={on('data')} onClick={() => actions.setTab('data')} />
        <Locked icon={Bell} feature="notifications" />
        <Item icon={Languages} label="Language: English" trailing={<ChosenMark />} />
        <Locked icon={Languages} feature="dutch" />
        <Locked icon={SunMoon} feature="appearance" />
        <Locked icon={Smartphone} feature="devices" />
      </Group>

      <Group title="Help">
        <Item icon={Lightbulb} label="How AgoraX works" active={on('how')} onClick={() => actions.setTab('how')} />
        <Item icon={CircleQuestionMark} label="FAQ" active={on('faq')} onClick={() => actions.setTab('faq')} />
        <Item icon={Mail} label="Contact" href="mailto:sondarevn@gmail.com" />
        <Item icon={FileText} label="Privacy policy" onClick={() => actions.openSheet('privacy')} />
        <Locked icon={ScrollText} feature="terms" />
      </Group>

      {state.isAdmin && (
        <Group title="Admin">
          <Item icon={ShieldCheck} label="Admin" href="/admin" />
        </Group>
      )}
    </div>
  );
};

/** Laptop: always there on the left. */
export const DesktopSidebar = () => (
  <aside aria-label="Menu" className="sheet fixed inset-y-0 left-0 z-40 hidden w-80 overflow-y-auto rounded-none border-y-0 border-l-0 lg:block">
    <SidebarContent />
  </aside>
);

/** Phone: the same sidebar, slid in from the left by the avatar button. */
export const SidebarDrawer = () => {
  const { state, actions } = useVisitor();

  useEffect(() => {
    if (!state.drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && actions.closeDrawer();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
            className="fixed inset-0 z-[60] bg-brand-dark/80 lg:hidden"
          />
          <motion.aside
            aria-label="Menu"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="sheet fixed inset-y-0 left-0 z-[70] w-[min(86vw,320px)] overflow-y-auto rounded-none border-y-0 border-l-0 lg:hidden"
          >
            <button onClick={actions.closeDrawer} aria-label="Close menu" className="absolute top-3 right-2 grid size-11 place-items-center text-slate-300 hover:text-white">
              <X size={22} />
            </button>
            <SidebarContent />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

/** Phone only: your avatar, top left, opens the drawer. */
export const MenuButton = () => {
  const { state, actions } = useVisitor();
  if (state.selected) return null;
  return (
    <button
      onClick={actions.openDrawer}
      aria-label="Open menu"
      aria-expanded={state.drawerOpen}
      className="fixed top-2.5 left-3 z-40 grid size-11 place-items-center rounded-full bg-brand-dark/80 shadow-lg ring-1 ring-sheet-line lg:hidden"
    >
      <ProfileAvatar size={36} />
    </button>
  );
};
