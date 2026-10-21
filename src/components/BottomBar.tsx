import React from 'react';
import { X, Bell } from 'lucide-react';
import { Event } from '../types';
import { remaining } from '../data/progress';

interface BottomBarProps {
  picks: Event[];
  showContactBanner: boolean;
  onOpenContact: () => void;
  onDismissBanner: () => void;
  onJumpTo: (event: Event) => void;
}

/** The nearest pick = the one that needs the fewest more people. */
function nearest(picks: Event[]): Event {
  return [...picks].sort((a, b) => remaining(a) - remaining(b))[0];
}

/**
 * Fixed to the bottom once the visitor has joined anything: an optional, dismissible
 * "leave a number" banner stacked above the "your picks" strip.
 */
export const BottomBar = ({ picks, showContactBanner, onOpenContact, onDismissBanner, onJumpTo }: BottomBarProps) => {
  if (picks.length === 0) return null;
  const closest = nearest(picks);
  const left = remaining(closest);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto px-4 pb-4 pointer-events-none">
      <div className="max-w-md mx-auto space-y-2 pointer-events-auto">
        {showContactBanner && (
          <div className="glass-dark rounded-2xl p-3 pl-4 flex items-center gap-3 border border-brand-secondary/30 shadow-xl backdrop-blur-xl">
            <Bell size={16} className="text-brand-secondary shrink-0" />
            <p className="text-xs text-slate-200 flex-grow leading-snug">
              Leave a number and we'll tell you when one of your events is happening.
            </p>
            <button
              onClick={onOpenContact}
              className="px-3 py-2 rounded-xl gradient-brand text-white text-xs font-bold whitespace-nowrap"
            >
              Leave a number
            </button>
            <button onClick={onDismissBanner} aria-label="Dismiss" className="p-1 text-slate-500 hover:text-white">
              <X size={16} />
            </button>
          </div>
        )}

        <button
          onClick={() => onJumpTo(closest)}
          className="w-full glass-dark rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-left border border-white/10 shadow-2xl backdrop-blur-xl"
        >
          <span className="text-xs text-slate-300 min-w-0">
            <span className="font-bold text-white">
              {picks.length} pick{picks.length === 1 ? '' : 's'}
            </span>
            <span className="text-slate-500"> · </span>
            <span className="truncate">
              {closest.emoji} {closest.title}
            </span>
          </span>
          <span className={`text-xs font-bold whitespace-nowrap ${left === 0 ? 'text-green-300' : 'text-brand-secondary'}`}>
            {left === 0 ? 'Runs!' : `${left} more and it runs`}
          </span>
        </button>
      </div>
    </div>
  );
};
