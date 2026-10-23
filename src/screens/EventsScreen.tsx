import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { LEGACY_CATEGORIES, PUBLIC_CATEGORIES } from '../types';
import { Filter, useVisitor } from '../state/VisitorProvider';
import { EventCard } from '../components/EventCard';
import { SuggestionBox } from '../components/SuggestionBox';
import { OpeningHero } from '../components/OpeningHero';
import { LIST_ID } from '../components/ui';

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
    <div className="sheet sticky top-2 z-30 ml-12 rounded-sheet p-1.5 lg:ml-0">
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
            className="min-h-11 flex-1 rounded-sheet border border-sheet-line bg-brand-dark px-3 text-[16px] text-white placeholder:text-slate-400 focus:border-brand-secondary focus:outline-none"
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
  <p className="py-16 text-center text-[15px] text-slate-300">{children}</p>
);

export const EventsScreen = () => {
  const { state, actions } = useVisitor();
  const { filter } = state;
  const setFilter = actions.setFilter;
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

  // With no search, the list is split into category sections, each with its own big heading.
  const groups = useMemo(() => {
    const q = query.trim();
    if (q) return [{ title: `Results for "${q}"`, events: shown }];
    return [...PUBLIC_CATEGORIES, ...LEGACY_CATEGORIES]
      .map((cat) => ({ title: cat as string, events: shown.filter((e) => e.category === cat) }))
      .filter((g) => g.events.length > 0);
  }, [shown, query]);

  return (
    <div>
      <OpeningHero />

      <div id={LIST_ID} className="mx-auto max-w-6xl snap-start scroll-mt-0 px-4 pt-2 sm:px-6">
        <FilterBar filter={filter} setFilter={setFilter} query={query} setQuery={setQuery} />

        {groups.map((g) => (
          <section key={g.title} className="mt-10 first-of-type:mt-6">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2
                className="font-display leading-none font-bold tracking-[-0.02em] text-white"
                style={{ fontSize: query.trim() ? 'clamp(24px, 4vw, 32px)' : 'clamp(32px, 6.5vw, 56px)' }}
              >
                {g.title}
              </h2>
              <span className="shrink-0 text-[13px] text-slate-300 tabular-nums">
                {g.events.length} {g.events.length === 1 ? 'event' : 'events'}
              </span>
            </div>
            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {g.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
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

        <div className="mt-10 sm:max-w-xl">
          <SuggestionBox />
        </div>

        <footer className="mt-8 space-y-1 text-[14px] text-slate-300">
          <p>No account needed. Nothing is charged until an event runs.</p>
          <p className="flex flex-wrap gap-x-5">
            <button onClick={() => actions.openSheet('space')} className="min-h-11 font-semibold text-brand-secondary underline underline-offset-4">
              I have a space
            </button>
          </p>
        </footer>
      </div>
    </div>
  );
};
