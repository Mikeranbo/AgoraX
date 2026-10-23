import { normalisePhone } from './contact';
import type { RanBefore, SpaceType } from '../types';

export const SPACE_TYPES: SpaceType[] = ['room', 'hall', 'cafe', 'other'];

const EMAIL = /^\S+@\S+\.\S+$/;

export function hasValidPhone(phone: string): boolean {
  return normalisePhone(phone).replace(/\D/g, '').length >= 8;
}

export function hasValidEmail(email: string): boolean {
  return EMAIL.test(email.trim());
}

/** Email or WhatsApp, either is enough; whichever is filled in must look right. */
export function contactProblem(email: string, phone: string): string | null {
  const e = email.trim();
  const p = phone.trim();
  if (!e && !p) return 'Add an email or a WhatsApp number.';
  if (e && !hasValidEmail(e)) return "That email doesn't look right.";
  if (p && !hasValidPhone(p)) return "That number doesn't look right. For example 06 12345678.";
  return null;
}

export interface HelperFormValues {
  firstName: string;
  phone: string;
  email: string;
  ranBefore: RanBefore | '';
  consent: boolean;
}

/** First problem with the "help run this" form, or null when it can be sent. */
export function validateHelperForm(v: HelperFormValues): string | null {
  if (!v.firstName.trim()) return 'Add your first name.';
  const contact = contactProblem(v.email, v.phone);
  if (contact) return contact;
  if (!v.ranBefore) return 'Say whether you have run something like this before.';
  if (!v.consent) return 'Tick the box so we can message you about it.';
  return null;
}

export interface VenueOfferValues {
  name: string;
  spaceType: SpaceType | '';
  capacity: string;
  contact: string;
  consent: boolean;
}

/** One contact box that takes a WhatsApp number or an email. */
export function splitContact(contact: string): { email: string; phone: string } {
  return hasValidEmail(contact) ? { email: contact.trim(), phone: '' } : { email: '', phone: contact.trim() };
}

/** First problem with the "I have a space" form, or null when it can be sent. */
export function validateVenueOffer(v: VenueOfferValues): string | null {
  const capacity = Number(v.capacity);
  if (!v.name.trim()) return 'Add your name.';
  if (!v.spaceType || !SPACE_TYPES.includes(v.spaceType)) return 'Pick the type of space.';
  if (v.capacity.trim() === '' || !Number.isInteger(capacity) || capacity < 1 || capacity > 5000) {
    return 'Roughly how many people fit? A whole number up to 5000.';
  }
  if (!hasValidEmail(v.contact) && !hasValidPhone(v.contact)) return 'Add a WhatsApp number or an email.';
  if (!v.consent) return 'Tick the box so we can message you about it.';
  return null;
}
