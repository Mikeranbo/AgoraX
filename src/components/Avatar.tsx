import React, { useState } from 'react';
import { User } from 'lucide-react';
import { useVisitor } from '../state/VisitorProvider';

const COLOURS = ['#818cf8', '#22d3ee', '#c084fc', '#a5b4fc', '#67e8f9'];

/** Stable colour per uid, shared by profile avatars and shown initials. */
export function colourFor(uid: string): string {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  return COLOURS[h % COLOURS.length];
}

/** A round picture, or the first letter of the name on a colour when there is none or it fails. */
export const ProfileImage = ({ src, name, size = 40, colourKey = name, ring = false }: {
  src?: string;
  name?: string;
  size?: number;
  colourKey?: string;
  ring?: boolean;
}) => {
  const [failed, setFailed] = useState(false);
  const initial = (name ?? '').trim().charAt(0).toUpperCase();
  const ringClass = ring ? 'ring-4 ring-sheet' : '';
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full object-cover ${ringClass}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-display font-bold text-brand-dark ${ringClass}`}
      style={{ width: size, height: size, fontSize: size * 0.45, backgroundColor: colourKey ? colourFor(colourKey) : COLOURS[0] }}
    >
      {initial || <User size={size * 0.5} strokeWidth={2.5} />}
    </span>
  );
};

/** The visitor's own avatar: their profile picture, else the first letter of their name. */
export const ProfileAvatar = ({ size = 40, ring = false }: { size?: number; ring?: boolean }) => {
  const { state } = useVisitor();
  return (
    <ProfileImage
      src={state.profile?.avatar}
      name={state.profile?.displayName ?? state.me?.displayName}
      size={size}
      colourKey={state.uid ?? undefined}
      ring={ring}
    />
  );
};

export function displayNameOf(name?: string): string {
  return name?.trim() || 'Guest';
}
