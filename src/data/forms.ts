import { normalisePhone } from './contact';
import type { RanBefore } from '../types';

const EMAIL = /^\S+@\S+\.\S+$/;

export function hasValidPhone(phone: string): boolean {
  return normalisePhone(phone).replace(/\D/g, '').length >= 8;
}

export function hasValidEmail(email: string): boolean {
  return EMAIL.test(email.trim());
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
  if (!hasValidPhone(v.phone)) return 'Add your WhatsApp number, for example 06 12345678.';
  if (v.email.trim() && !hasValidEmail(v.email)) return "That email doesn't look right.";
  if (!v.ranBefore) return 'Say whether you have run something like this before.';
  if (!v.consent) return 'Tick the box so we can message you about it.';
  return null;
}
