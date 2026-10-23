import { contactProblem } from './forms';
import { PUBLIC_CATEGORIES } from '../types';
import type { EventCategory, Proposal } from '../types';
import type { EventFormData } from '../services/adminService';

export interface ProposalFormValues {
  title: string;
  category: EventCategory | '';
  price: string;
  minPeople: string;
  firstName: string;
  phone: string;
  email: string;
  needs: string;
  consent: boolean;
}

/**
 * First problem with the Propose form, or null when it can be sent. A draft only needs the
 * event itself; the contact details and consent are asked for when it is sent for review.
 */
export function validateProposal(v: ProposalFormValues, mode: 'send' | 'draft' = 'send'): string | null {
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
  if (v.needs.trim().length > 500) return 'Keep the last answer under 500 characters.';
  if (mode === 'draft') return null;
  if (!v.firstName.trim()) return 'Add your first name.';
  const contact = contactProblem(v.email, v.phone);
  if (contact) return contact;
  if (!v.consent) return 'Tick the box so we can message you about it.';
  return null;
}

/**
 * The pending event an approved proposal becomes. Counters are added by the writer. It gets no
 * date: an admin sets a real one and ticks "date confirmed" when the event is agreed.
 */
export function eventFromProposal(p: Proposal, _now: number): EventFormData & { origin: 'proposal'; proposalId: string; organiserPublicId?: string } {
  return {
    title: p.title,
    description: p.title,
    category: p.category,
    price: p.price,
    minParticipants: p.minPeople,
    status: 'Pending',
    imageUrls: p.image ? [p.image] : [],
    ...(p.imageCredit ? { imageCredit: p.imageCredit } : {}),
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
    ...(p.organiserPublicId ? { organiserPublicId: p.organiserPublicId } : {}),
  };
}
