import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { EventCategory, PUBLIC_CATEGORIES } from '../types';
import { useVisitor } from '../state/VisitorProvider';
import { EventCard } from '../components/EventCard';
import { SuggestionBox } from '../components/SuggestionBox';

type Filter = EventCategory | 'All';
const CHIPS: Filter[] = ['All', ...PUBLIC_CATEGORIES];

/** Sticky under the header: category chips, or the search field in their place. */
const FilterBar = ({ filter, setFilter, query, setQuery }: {
  filter: Filter;
  setFilter: (f: Filter) => void;
  query: string;
  setQuery: (q: string) => void;
}) => {
  const [searching, setSearching] = useState(false);
  const closeSearch = () => {
    setSearching(false);
    setQuery('');
  };

  return (
    <div className="sticky top-0 z-30 -mx-4 border-b border-sheet-line bg-brand-dark px-4 py-2 sm:mx-0 sm:px-0">
      {searching ? (
        <div className="flex items-center gap-2">
          <label htmlFor="event-search" className="sr-only">Search events</label>
          <input
            id="event-search"
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chess, hiking, pottery…"
            className="min-h-11 flex-1 rounded-sheet border border-sheet-line bg-sheet px-3 text-[16px] text-white placeholder:text-slate-400 focus:border-brand-secondary focus:outline-none"
          />
          <button onClick={closeSearch} aria-label="Close search" className="grid size-11 place-items-center text-slate-300 hover:text-white">
            <X size={20} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearching(true)}
            aria-label="Search events"
            className="grid size-11 shrink-0 place-items-center rounded-sheet border border-sheet-line text-slate-200 hover:border-slate-500"
          >
            <Search size={18} />
          </button>
          <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Categories">
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                aria-pressed={filter === c}
                className={`min-h-11 shrink-0 whitespace-nowrap rounded-sheet border px-4 text-[15px] font-semibold ${
                  filter === c
                    ? 'border-white bg-white text-brand-dark'
                    : 'border-sheet-line text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="col-span-full py-16 text-center text-[15px] text-slate-400">{children}</p>
);

export const EventsScreen = () => {
  const { state, actions } = useVisitor();
  const [filter, setFilter] = useState<Filter>('All');
  const [query, setQuery] = useState('');

  // Cancelled events are withdrawn from the public page; admins still see them at /admin.
  const visible = useMemo(() => state.events.filter((e) => e.status !== 'Cancelled'), [state.events]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter(
      (e) =>
        (filter === 'All' || e.category === filter) &&
        (!q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)),
    );
  }, [visible, filter, query]);

  return (
    <div className="px-4 sm:px-6">
      <header className="pt-5 pb-4">
        <p className="mb-5 font-display text-[17px] font-extrabold tracking-tight text-white">
          Agora<span className="text-brand-secondary">X</span>
        </p>
        <h1 className="max-w-xl font-display text-[30px] font-bold leading-[1.05] tracking-tight text-white sm:text-[40px]">
          What would you actually go to?
        </h1>
        <p className="mt-2 max-w-xl text-[16px] leading-snug text-slate-300">
          Every event has a target. When enough people want one, it happens.
        </p>
      </header>

      <FilterBar filter={filter} setFilter={setFilter} query={query} setQuery={setQuery} />

      <div className="grid grid-cols-1 items-start gap-3 pt-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {shown.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        {shown.length === 0 && (
          <Empty>
            {state.eventsError
              ? "Couldn't load the events. Check your connection and refresh."
              : !state.eventsLoaded
                ? 'Loading events…'
                : visible.length === 0
                  ? 'The first events go up soon.'
                  : query
                    ? `Nothing matches "${query}". Suggest it below.`
                    : 'Nothing in this category yet.'}
          </Empty>
        )}
      </div>

      <div className="mt-10 sm:max-w-xl">
        <SuggestionBox />
      </div>

      <footer className="mt-8 space-y-1 text-[14px] text-slate-400">
        <p>No account needed. Nothing is charged until an event runs.</p>
        <p className="flex flex-wrap gap-x-5">
          <button onClick={() => actions.openSheet('space')} className="min-h-11 font-semibold text-brand-secondary underline underline-offset-4">
            I have a space
          </button>
          <button onClick={() => actions.openSheet('privacy')} className="min-h-11 font-semibold text-slate-300 underline underline-offset-4">
            Your details
          </button>
        </p>
      </footer>
    </div>
  );
};
