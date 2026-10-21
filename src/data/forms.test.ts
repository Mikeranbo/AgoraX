import { describe, expect, it } from 'vitest';
import { validateHelperForm } from './forms';

const ok = { firstName: 'Anna', phone: '06 12345678', email: '', ranBefore: 'no' as const, consent: true };

describe('validateHelperForm (APP_CHANGES §6)', () => {
  it('accepts a complete form with no email', () => {
    expect(validateHelperForm(ok)).toBeNull();
  });

  it('needs a first name', () => {
    expect(validateHelperForm({ ...ok, firstName: '  ' })).toMatch(/first name/i);
  });

  it('needs a WhatsApp number long enough to be real', () => {
    expect(validateHelperForm({ ...ok, phone: '0612' })).toMatch(/whatsapp/i);
    expect(validateHelperForm({ ...ok, phone: '' })).toMatch(/whatsapp/i);
  });

  it('accepts an email but rejects a malformed one', () => {
    expect(validateHelperForm({ ...ok, email: 'anna@rug.nl' })).toBeNull();
    expect(validateHelperForm({ ...ok, email: 'anna@' })).toMatch(/email/i);
  });

  it('needs the "run something like this before" answer', () => {
    expect(validateHelperForm({ ...ok, ranBefore: '' })).toMatch(/before/i);
  });

  it('never accepts without consent', () => {
    expect(validateHelperForm({ ...ok, consent: false })).toMatch(/tick/i);
  });
});
