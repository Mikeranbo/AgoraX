import { describe, expect, it } from 'vitest';
import { filterEvents, hasActiveFilters, EventQuery } from './eventFilters';
import type { Event } from '../types';

const ev = (id: string, extra: Partial<Event> = {}): Event =>
  ({
    id,
    title: id,
    description: '',
    category: 'Games',
    price: 5,
    minParticipants: 10,
    participantsCount: 0,
    status: 'Pending',
    organizerId: 'agorax',
    imageUrls: [],
    ...extra,
  }) as Event;

const now = new Date('2026-11-13T09:00:00Z');
const base: EventQuery = { view: 'proposals', category: 'All', date: 'any', place: { city: 'Groningen', scope: 'all' }, search: '' };

const proposal = ev('chess', { startTime: '2026-11-13T18:00:00Z' }); // a placeholder date from seeding
const tonight = ev('quiz', { status: 'Confirmed', dateConfirmed: true, startTime: '2026-11-13T18:00:00Z', category: 'Social' });
const tomorrow = ev('climb', { status: 'Confirmed', dateConfirmed: true, startTime: '2026-11-14T15:00:00Z', category: 'Sports' });
const confirmedNoDate = ev('pottery', { status: 'Confirmed', category: 'Creative' });
const cancelled = ev('gone', { status: 'Cancelled' });
const assen = ev('assen-walk', { city: 'Assen', category: 'Outdoor' });
const amsterdam = ev('ams-museum', { city: 'Amsterdam', category: 'Creative' });
const island = ev('island', { city: 'Schiermonnikoog', category: 'Outdoor' });
const all = [proposal, tonight, tomorrow, confirmedNoDate, cancelled, assen, amsterdam, island];
const ids = (list: Event[]) => list.map((e) => e.id);

describe('proposals versus scheduled events', () => {
  it('shows proposals (including confirmed ones still without a date) and hides cancelled ones', () => {
    expect(ids(filterEvents(all, base, now))).toEqual(['chess', 'pottery', 'assen-walk', 'ams-museum', 'island']);
  });

  it('never shows a proposal as happening today, even with a placeholder date', () => {
    const today = filterEvents(all, { ...base, view: 'scheduled', date: 'today' }, now);
    expect(ids(today)).toEqual(['quiz']);
  });

  it('lists scheduled events by date', () => {
    expect(ids(filterEvents(all, { ...base, view: 'scheduled' }, now))).toEqual(['quiz', 'climb']);
    expect(ids(filterEvents(all, { ...base, view: 'scheduled', date: 'tomorrow' }, now))).toEqual(['climb']);
  });

  it('gives an empty scheduled list when nothing is scheduled', () => {
    expect(filterEvents([proposal, assen], { ...base, view: 'scheduled' }, now)).toEqual([]);
  });
});

describe('location', () => {
  it('near Groningen includes events without a city and places within 40 km', () => {
    expect(ids(filterEvents(all, { ...base, place: { city: 'Groningen', scope: 'near' } }, now))).toEqual(['chess', 'pottery', 'assen-walk']);
  });

  it('other locations includes far places and places we cannot locate, never near ones', () => {
    expect(ids(filterEvents(all, { ...base, place: { city: 'Groningen', scope: 'other' } }, now))).toEqual(['ams-museum', 'island']);
  });

  it('follows the chosen city', () => {
    expect(ids(filterEvents(all, { ...base, place: { city: 'Amsterdam', scope: 'near' } }, now))).toEqual(['ams-museum']);
  });
});

describe('combining filters', () => {
  it('combines location with category', () => {
    expect(ids(filterEvents(all, { ...base, category: 'Outdoor', place: { city: 'Groningen', scope: 'near' } }, now))).toEqual(['assen-walk']);
    expect(ids(filterEvents(all, { ...base, category: 'Outdoor', place: { city: 'Groningen', scope: 'other' } }, now))).toEqual(['island']);
  });

  it('searches title, description, category and city', () => {
    expect(ids(filterEvents(all, { ...base, search: 'assen' }, now))).toEqual(['assen-walk']);
    expect(ids(filterEvents(all, { ...base, search: 'creative' }, now))).toEqual(['pottery', 'ams-museum']);
  });

  it('knows when filters are active, so "Clear filters" can show', () => {
    expect(hasActiveFilters(base)).toBe(false);
    expect(hasActiveFilters({ ...base, category: 'Games' })).toBe(true);
    expect(hasActiveFilters({ ...base, date: 'today' })).toBe(true);
    expect(hasActiveFilters({ ...base, place: { city: 'Groningen', scope: 'near' } })).toBe(true);
  });
});
