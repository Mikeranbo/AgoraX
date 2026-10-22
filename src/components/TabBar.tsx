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
      className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[13px] font-semibold ${
        active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      <span className="grid size-8 place-items-center">{children}</span>
      {label}
    </button>
  );
};

/** Events · (+) Propose · My picks */
export const TabBar = () => {
  const { meta } = useVisitor();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sheet-line bg-brand-dark pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-md items-stretch px-2">
        <TabButton tab="events" label="Events">
          <ListChecks size={22} />
        </TabButton>
        <TabButton tab="propose" label="Propose">
          <span className="gradient-brand grid size-8 place-items-center rounded-full text-white">
            <Plus size={20} strokeWidth={2.5} />
          </span>
        </TabButton>
        <TabButton tab="picks" label={meta.picks.length ? `My picks (${meta.picks.length})` : 'My picks'}>
          <Star size={22} />
        </TabButton>
      </div>
    </nav>
  );
};
