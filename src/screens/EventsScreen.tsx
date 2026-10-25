import React, { useMemo, useState } from 'react';
import { LocateFixed, Search, X } from 'lucide-react';
import { LEGACY_CATEGORIES, PUBLIC_CATEGORIES } from '../types';
import { Filter, PlaceFilter, useVisitor } from '../state/VisitorProvider';
import { EventCard } from '../components/EventCard';
import { SuggestionBox } from '../components/SuggestionBox';
import { LIST_ID, fieldClass } from '../components/ui';
import { filterEvents, hasActiveFilters } from '../data/eventFilters';
import { CITIES, NEAR_KM } from '../data/location';
import type { DateFilter } from '../data/schedule';
import { PILOT_CITY } from '../config/pilot';

const CHIPS: Filter[] = ['All', ...PUBLIC_CATEGORIES];

const chipClass = (on: boolean) =>
  `min-h-11 shrink-0 whitespace-nowrap rounded-sheet border px-4 text-[15px] font-semibold ${
    on ? 'border-white bg-white text-brand-dark' : 'border-sheet-line text-slate-300 hover:border-slate-500 hover:text-white'
  }`;

/** Proposals | Scheduled: two different things, so they never share one list. */
const ViewSwitch = () => {
  const { state, actions } = useVisitor();
  const option = (value: 'proposals' | 'scheduled', label: string) => (
    <button
      role="radio"
      aria-checked={state.view === value}
      onClick={() => actions.setView(value)}
      className={`min-h-11 flex-1 rounded-sheet px-3 text-[15px] font-semibold ${
        state.view === value ? 'bg-white text-brand-dark' : 'text-slate-300 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div role="radiogroup" aria-label="Show" className="flex gap-1 rounded-sheet border border-sheet-line bg-sheet p-1">
      {option('proposals', 'Proposals')}
      {option('scheduled', 'Scheduled')}
    </div>
  );
};

/** Sticky under the header: category chips, or the search field in their place. */
const FilterBar = ({ query, setQuery }: { query: string; setQuery: (q: string) => void }) => {
  const { state, actions } = useVisitor();
  const [searching, setSearching] = useState(false);
  const closeSearch = () => {
    setSearching(false);
    setQuery('');
  };

  return (
    <div className="sheet sticky top-2 z-30 mx-12 rounded-sheet p-1.5">
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
              <button key={c} onClick={() => actions.setFilter(c)} aria-pressed={state.filter === c} className={chipClass(state.filter === c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DATE_CHIPS: { value: DateFilter; label: string }[] = [
  { value: 'any', label: 'All upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'week', label: 'Next 7 days' },
];

/** Where and when. "Near" is explained right next to it; location is only asked for on a tap. */
const MoreFilters = ({ active }: { active: boolean }) => {
  const { state, actions } = useVisitor();
  const { place } = state;
  const set = (next: Partial<PlaceFilter>) => actions.setPlace({ ...place, ...next });
  const scope = (value: PlaceFilter['scope'], label: string) => (
    <button key={value} onClick={() => set({ scope: value })} aria-pressed={place.scope === value} className={chipClass(place.scope === value)}>
      {label}
    </button>
  );

  return (
    <div className="sheet mt-3 space-y-3 rounded-sheet p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="city" className="sr-only">City</label>
        <select id="city" value={place.city} onChange={(e) => set({ city: e.target.value })} className={`${fieldClass.replace('w-full', 'w-auto')} min-w-40 sm:max-w-xs`}>
          {CITIES.map((c) => (
            <option key={c.name} value={c.name} className="bg-brand-dark">
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={actions.locateMe}
          disabled={state.locating}
          className="inline-flex min-h-11 items-center gap-2 rounded-sheet border border-sheet-line px-3 text-[15px] font-semibold text-slate-200 hover:border-slate-500 disabled:opacity-60"
        >
          <LocateFixed size={16} aria-hidden="true" /> {state.locating ? 'Finding…' : 'Use my location'}
        </button>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Location">
        {scope('all', 'All locations')}
        {scope('near', `Near ${place.city}`)}
        {scope('other', 'Other locations')}
      </div>
      {state.view === 'scheduled' && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Date">
          {DATE_CHIPS.map((d) => (
            <button key={d.value} onClick={() => actions.setDateFilter(d.value)} aria-pressed={state.dateFilter === d.value} className={chipClass(state.dateFilter === d.value)}>
              {d.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <details className="group text-[13px] text-slate-300">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center font-semibold text-slate-200 underline underline-offset-4">
            How "near" works
          </summary>
          <p className="max-w-[70ch] pb-2 leading-relaxed">
            "Near" means the same city or one within about {NEAR_KM} km. All current proposals are organised from {PILOT_CITY}; some, like
            trips, take place outside the city. Your location is only used once, to pick the nearest city on the list, and isn't stored.
          </p>
        </details>
        {active && (
          <button onClick={actions.clearFilters} className="min-h-11 text-[14px] font-semibold text-white underline underline-offset-4">
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};

const Empty = ({ children }: { children: React.ReactNode }) => <div className="py-14 text-center text-[15px] text-slate-300">{children}</div>;

export const EventsScreen = () => {
  const { state, actions } = useVisitor();
  const [query, setQuery] = useState('');
  const filters = { view: state.view, category: state.filter, date: state.dateFilter, place: state.place, search: query };
  const active = hasActiveFilters(filters);

  const shown = useMemo(
    () => filterEvents(state.events, filters, new Date()),
    [state.events, state.view, state.filter, state.dateFilter, state.place, query],
  );

  // Proposals are split into category sections, each with its own big heading; scheduled
  // events and search results stay one list, in date or match order.
  const groups = useMemo(() => {
    const q = query.trim();
    if (q) return [{ title: `Results for "${q}"`, events: shown }];
    if (state.view === 'scheduled') return [{ title: 'Scheduled', events: shown }];
    return [...PUBLIC_CATEGORIES, ...LEGACY_CATEGORIES]
      .map((cat) => ({ title: cat as string, events: shown.filter((e) => e.category === cat) }))
      .filter((g) => g.events.length > 0);
  }, [shown, query, state.view]);

  const emptyMessage = () => {
    if (state.eventsError) return <p>Couldn't load the events. Check your connection and refresh.</p>;
    if (!state.eventsLoaded) return <p role="status">Loading events…</p>;
    if (state.view === 'scheduled' && !active && !query) {
      return (
        <>
          <p className="mx-auto max-w-[52ch]">
            Nothing is scheduled yet. Everything here is still a proposal, and the ones with the most genuine interest are the ones we'll
            try to run.
          </p>
          <button onClick={() => actions.setView('proposals')} className="mt-3 min-h-11 font-semibold text-white underline underline-offset-4">
            See the proposals
          </button>
        </>
      );
    }
    return (
      <>
        <p>{query ? `Nothing matches "${query}".` : 'Nothing matches these filters.'}</p>
        {active && (
          <button onClick={actions.clearFilters} className="mt-3 min-h-11 font-semibold text-white underline underline-offset-4">
            Clear filters
          </button>
        )}
      </>
    );
  };

  return (
    <div>
      <h1 className="sr-only">AgoraX proposals</h1>

      <div id={LIST_ID} className="mx-auto max-w-6xl scroll-mt-0 px-4 pt-3 sm:px-6">
        <div className="mx-12 mb-3 max-w-md">
          <ViewSwitch />
        </div>
        <FilterBar query={query} setQuery={setQuery} />
        <MoreFilters active={active} />

        {groups.map((g) =>
          g.events.length === 0 ? null : (
            <section key={g.title} className="mt-10 first-of-type:mt-6">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <h2
                  className="font-display leading-none font-bold tracking-[-0.02em] text-white"
                  style={{ fontSize: query.trim() ? 'clamp(24px, 4vw, 32px)' : 'clamp(32px, 6.5vw, 56px)' }}
                >
                  {g.title}
                </h2>
                <span className="shrink-0 text-[13px] font-semibold text-white tabular-nums">
                  {g.events.length} {state.view === 'scheduled' ? (g.events.length === 1 ? 'event' : 'events') : g.events.length === 1 ? 'proposal' : 'proposals'}
                </span>
              </div>
              <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {g.events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ),
        )}

        {shown.length === 0 && <Empty>{emptyMessage()}</Empty>}

        <div className="mt-10 sm:max-w-xl">
          <SuggestionBox />
        </div>

      </div>
    </div>
  );
};
