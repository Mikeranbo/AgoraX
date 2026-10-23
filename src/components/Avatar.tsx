import React from 'react';
import { User } from 'lucide-react';
import { useVisitor } from '../state/VisitorProvider';

const COLOURS = ['#818cf8', '#22d3ee', '#c084fc', '#a5b4fc', '#67e8f9'];

/** Stable colour per uid, shared by profile avatars and shown initials. */
export function colourFor(uid: string): string {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  return COLOURS[h % COLOURS.length];
}

/** The visitor's own avatar: the first letter of their display name, or a person icon. */
export const ProfileAvatar = ({ size = 40 }: { size?: number }) => {
  const { state } = useVisitor();
  const initial = (state.me?.displayName ?? '').trim().charAt(0).toUpperCase();
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full font-display font-bold text-brand-dark"
      style={{ width: size, height: size, fontSize: size * 0.45, backgroundColor: state.uid ? colourFor(state.uid) : COLOURS[0] }}
    >
      {initial || <User size={size * 0.5} strokeWidth={2.5} />}
    </span>
  );
};

export function displayNameOf(name?: string): string {
  return name?.trim() || 'Guest';
}
