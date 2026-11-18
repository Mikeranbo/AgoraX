import React from 'react';
import { BadgeCheck } from 'lucide-react';

/** Shown on approved organisers and on the events they put live. An admin approved them. */
export const OrganiserBadge = ({ small = false }: { small?: boolean }) => (
  <span
    title="An AgoraX admin approved this organiser"
    className={`inline-flex items-center gap-1 rounded-full border border-x-cyan/50 bg-x-cyan/10 font-semibold text-white ${
      small ? 'px-2 py-0.5 text-[12px]' : 'px-2.5 py-1 text-[13px]'
    }`}
  >
    <BadgeCheck size={small ? 13 : 15} aria-hidden="true" className="text-x-cyan" />
    Approved organiser
  </span>
);
