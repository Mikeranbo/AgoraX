import React from 'react';
import { ListChecks, Plus, Star } from 'lucide-react';
import { Tab, useVisitor } from '../state/VisitorProvider';

const TabButton = ({ tab, label, children }: { tab: Tab; label: string; children: React.ReactNode }) => {
  const { state, actions } = useVisitor();
  const active = state.tab === tab;
  return (
    <button
      onClick={() => actions.setTab(tab)}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-[12px] leading-4 font-semibold ${
        active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      <span className="grid size-6 place-items-center">{children}</span>
      {label}
    </button>
  );
};

/** Proposals · (+) Propose · Interests. Slim: 22–24px icons, 12px labels. */
export const TabBar = () => {
  const { meta } = useVisitor();
  return (
    <nav
      aria-label="Main"
      className="sheet fixed inset-x-3 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-2xl lg:hidden"
    >
      <div className="flex items-stretch px-2">
        <TabButton tab="events" label="Proposals">
          <ListChecks size={22} />
        </TabButton>
        <TabButton tab="propose" label="Propose">
          <span className="gradient-brand grid size-6 place-items-center rounded-full text-white">
            <Plus size={16} strokeWidth={2.75} />
          </span>
        </TabButton>
        <TabButton tab="picks" label={meta.picks.length ? `Interests (${meta.picks.length})` : 'Interests'}>
          <Star size={22} />
        </TabButton>
      </div>
    </nav>
  );
};
