import { describe, expect, it } from 'vitest';
import { selectEventsToPurge } from './purge';
import { SEED_EVENTS } from './seedEvents';

const SEED_SLUGS = SEED_EVENTS.map((e) => e.slug);

describe('selectEventsToPurge', () => {
  it('keeps every one of the 33 seed events', () => {
    const events = SEED_SLUGS.map((id) => ({ id }));
    expect(selectEventsToPurge(events, SEED_SLUGS)).toEqual([]);
    expect(SEED_SLUGS).toHaveLength(33);
  });

  it('removes old test events, whatever their id looks like', () => {
    const events = [
      { id: 'chess-challenge' },
      { id: 'Test' },
      { id: 'jRr1zluJTD2V9LLkE3qG' },
      { id: 'Муравьиный-бой' },
    ];
    expect(selectEventsToPurge(events, SEED_SLUGS)).toEqual(['Test', 'jRr1zluJTD2V9LLkE3qG', 'Муравьиный-бой']);
  });

  it('keeps events an admin created by approving a proposal', () => {
    const events = [{ id: 'auto123', origin: 'proposal' as const }, { id: 'auto456' }];
    expect(selectEventsToPurge(events, SEED_SLUGS)).toEqual(['auto456']);
  });

  it('returns nothing for no events', () => {
    expect(selectEventsToPurge([], SEED_SLUGS)).toEqual([]);
  });
});
