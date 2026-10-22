import { hasValidPhone } from './forms';
import { PUBLIC_CATEGORIES } from '../types';
import type { EventCategory, Proposal } from '../types';
import type { EventFormData } from '../services/adminService';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ProposalFormValues {
  title: string;
  category: EventCategory | '';
  price: string;
  minPeople: string;
  firstName: string;
  phone: string;
  needs: string;
  consent: boolean;
}

/** First problem with the Propose form, or null when it can be sent. */
export function validateProposal(v: ProposalFormValues): string | null {
  const title = v.title.trim();
  const price = Number(v.price);
  const minPeople = Number(v.minPeople);
  if (title.length < 3) return 'Say what the event is.';
  if (title.length > 120) return 'Keep the title shorter, 120 characters at most.';
  if (!v.category || !PUBLIC_CATEGORIES.includes(v.category)) return 'Pick a category.';
  if (v.price.trim() === '' || !Number.isFinite(price) || price < 0 || price > 200) {
    return 'Give a rough price between €0 and €200.';
  }
  if (!Number.isInteger(minPeople) || minPeople < 2 || minPeople > 200) {
    return 'Say how many people it needs, between 2 and 200.';
  }
  if (!v.firstName.trim()) return 'Add your first name.';
  if (!hasValidPhone(v.phone)) return 'Add your WhatsApp number, for example 06 12345678.';
  if (v.needs.trim().length > 500) return 'Keep the last answer under 500 characters.';
  if (!v.consent) return 'Tick the box so we can message you about it.';
  return null;
}

/** The pending event an approved proposal becomes. Counters are added by the writer. */
export function eventFromProposal(p: Proposal, now: number): EventFormData & { origin: 'proposal'; proposalId: string } {
  return {
    title: p.title,
    description: p.title,
    category: p.category,
    price: p.price,
    minParticipants: p.minPeople,
    status: 'Pending',
    deadline: new Date(now + 21 * DAY_MS).toISOString(),
    startTime: new Date(now + 28 * DAY_MS).toISOString(),
    imageUrls: [],
    emoji: '💡',
    accent: '#818cf8',
    durationHours: 2,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: '',
    venueNote: '',
    season: 'any',
    origin: 'proposal',
    proposalId: p.id,
  };
}
