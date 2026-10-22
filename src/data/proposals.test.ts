import { describe, expect, it } from 'vitest';
import { eventFromProposal, validateProposal } from './proposals';
import type { Proposal } from '../types';

const form = {
  title: 'Sunday board-game brunch',
  category: 'Games' as const,
  price: '5',
  minPeople: '8',
  firstName: 'Anna',
  phone: '06 12345678',
  needs: 'A café that opens early',
  consent: true,
};

describe('validateProposal (APP_CHANGES §9)', () => {
  it('accepts a complete one-minute form', () => {
    expect(validateProposal(form)).toBeNull();
  });

  it('needs a title of 3 to 120 characters', () => {
    expect(validateProposal({ ...form, title: 'Go' })).toMatch(/what/i);
    expect(validateProposal({ ...form, title: 'x'.repeat(121) })).toMatch(/shorter/i);
  });

  it('keeps the rough price between free and €200', () => {
    expect(validateProposal({ ...form, price: '0' })).toBeNull();
    expect(validateProposal({ ...form, price: '-1' })).toMatch(/price/i);
    expect(validateProposal({ ...form, price: '201' })).toMatch(/price/i);
    expect(validateProposal({ ...form, price: 'cheap' })).toMatch(/price/i);
  });

  it('needs between 2 and 200 people', () => {
    expect(validateProposal({ ...form, minPeople: '1' })).toMatch(/people/i);
    expect(validateProposal({ ...form, minPeople: '201' })).toMatch(/people/i);
    expect(validateProposal({ ...form, minPeople: '7.5' })).toMatch(/people/i);
  });

  it('needs a first name, a WhatsApp number and consent', () => {
    expect(validateProposal({ ...form, firstName: '' })).toMatch(/first name/i);
    expect(validateProposal({ ...form, phone: '0612' })).toMatch(/whatsapp/i);
    expect(validateProposal({ ...form, consent: false })).toMatch(/tick/i);
  });

  it('only allows the public categories', () => {
    expect(validateProposal({ ...form, category: 'Concert' as never })).toMatch(/category/i);
  });
});

describe('eventFromProposal', () => {
  const now = new Date('2026-10-21T12:00:00Z').getTime();
  const p: Proposal = {
    id: 'prop1',
    uid: 'u1',
    title: 'Sunday board-game brunch',
    category: 'Games',
    price: 5,
    minPeople: 8,
    needs: 'A café',
    status: 'new',
    source: 'direct',
  };

  it('becomes a pending event marked as coming from a proposal', () => {
    const e = eventFromProposal(p, now);
    expect(e).toMatchObject({
      title: 'Sunday board-game brunch',
      category: 'Games',
      price: 5,
      minParticipants: 8,
      status: 'Pending',
      origin: 'proposal',
      proposalId: 'prop1',
      imageUrls: [],
    });
  });

  it('closes 21 days after approval', () => {
    expect(new Date(eventFromProposal(p, now).deadline).getTime() - now).toBe(21 * 24 * 60 * 60 * 1000);
  });

  it('never uses the ticket emoji', () => {
    expect(eventFromProposal(p, now).emoji).not.toBe('🎟️');
  });
});
