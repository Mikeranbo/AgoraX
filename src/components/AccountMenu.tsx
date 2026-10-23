import React, { useEffect, useRef } from 'react';
import { Bell, FileText, KeyRound, Shield, Sparkles, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tab, useVisitor } from '../state/VisitorProvider';
import { ProfileAvatar, displayNameOf } from './Avatar';

const MENU_ID = 'account-menu';

/**
 * Defined outside AccountMenu on purpose: a component created during render is a new type on
 * every render, so React would remount the items (and drop keyboard focus) whenever data updates.
 */
const Entry = ({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) => (
  <button role="menuitem" onClick={onClick} className="flex min-h-11 w-full items-center gap-3 rounded-sheet px-3 text-left text-[15px] text-slate-200 hover:bg-white/5 hover:text-white focus:bg-white/5">
    <Icon size={18} aria-hidden="true" className="text-slate-400" />
    {label}
  </button>
);

/** Personal settings, from the avatar top right. Everything about *you*, nothing about events. */
export const AccountMenu = () => {
  const { state, actions } = useVisitor();
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const open = state.accountMenuOpen;
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    else if (wasOpen.current) button.current?.focus({ preventScroll: true });
    wasOpen.current = open;
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') actions.setAccountMenu(false);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
        const i = items.indexOf(document.activeElement as HTMLElement);
        items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!menu.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) actions.setAccountMenu(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  if (state.selected) return null;

  const go = (tab: Tab) => () => actions.setTab(tab);

  return (
    <div className="fixed top-2.5 right-3 z-50">
      <button
        ref={button}
        onClick={() => actions.setAccountMenu(!open)}
        aria-label="Account and settings"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={MENU_ID}
        className="grid size-11 place-items-center rounded-full bg-brand-dark/90 shadow-lg ring-1 ring-sheet-line hover:ring-slate-500"
      >
        <ProfileAvatar size={36} />
      </button>
      {open && (
        <div ref={menu} id={MENU_ID} role="menu" aria-label="Account and settings" className="sheet absolute top-13 right-0 w-72 rounded-sheet p-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <ProfileAvatar size={40} />
            <div className="min-w-0">
              <p className="truncate font-display text-[17px] font-bold text-white">{displayNameOf(state.profile?.displayName ?? state.me?.displayName)}</p>
              <p className="text-[12px] text-slate-400">On this device only. No login.</p>
            </div>
          </div>
          <div className="my-1 border-t border-sheet-line" />
          <Entry icon={User} label="Profile" onClick={go('profile')} />
          <Entry icon={Sparkles} label="Attend, organise or both" onClick={() => actions.openSheet('mode')} />
          <Entry icon={Bell} label="Notification preferences" onClick={go('notifications')} />
          <Entry icon={Shield} label="Privacy & my data" onClick={go('data')} />
          <Entry icon={KeyRound} label="Account & security" onClick={go('account')} />
          <Entry icon={FileText} label="Privacy notice" onClick={go('notice')} />
        </div>
      )}
    </div>
  );
};
