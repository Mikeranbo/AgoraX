import { describe, expect, it } from 'vitest';
import { contactProblem, splitContact, validateHelperForm, validateVenueOffer } from './forms';

const space = { name: 'Anna', spaceType: 'cafe' as const, capacity: '40', contact: '06 12345678', consent: true };

describe('validateVenueOffer (APP_CHANGES §10)', () => {
  it('accepts a complete offer', () => {
    expect(validateVenueOffer(space)).toBeNull();
    expect(validateVenueOffer({ ...space, contact: 'anna@rug.nl' })).toBeNull();
  });

  it('needs a whole number of people between 1 and 5000', () => {
    for (const capacity of ['0', 'abc', '6000', '12.5', '']) {
      expect(validateVenueOffer({ ...space, capacity })).toMatch(/people/i);
    }
  });

  it('needs one of the four types of space', () => {
    expect(validateVenueOffer({ ...space, spaceType: '' })).toMatch(/type/i);
  });

  it('needs a reachable contact and consent', () => {
    expect(validateVenueOffer({ ...space, contact: 'call me' })).toMatch(/whatsapp|email/i);
    expect(validateVenueOffer({ ...space, consent: false })).toMatch(/tick/i);
  });
});

describe('splitContact', () => {
  it('files an email as an email and anything else as a phone', () => {
    expect(splitContact('Anna@RUG.nl')).toEqual({ email: 'Anna@RUG.nl', phone: '' });
    expect(splitContact('06 12345678')).toEqual({ email: '', phone: '06 12345678' });
  });
});

const ok = { firstName: 'Anna', phone: '06 12345678', email: '', ranBefore: 'no' as const, consent: true };

describe('validateHelperForm (APP_CHANGES §6)', () => {
  it('accepts a complete form with no email', () => {
    expect(validateHelperForm(ok)).toBeNull();
  });

  it('needs a first name', () => {
    expect(validateHelperForm({ ...ok, firstName: '  ' })).toMatch(/first name/i);
  });

  it('needs an email or a WhatsApp number, either is enough', () => {
    expect(validateHelperForm({ ...ok, phone: '' })).toMatch(/email or a whatsapp/i);
    expect(validateHelperForm({ ...ok, phone: '', email: 'anna@rug.nl' })).toBeNull();
  });

  it('rejects a number too short to be real', () => {
    expect(validateHelperForm({ ...ok, phone: '0612' })).toMatch(/number doesn't look right/i);
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

describe('contactProblem', () => {
  it('takes an email, a WhatsApp number, or both', () => {
    expect(contactProblem('anna@rug.nl', '')).toBeNull();
    expect(contactProblem('', '06 12345678')).toBeNull();
    expect(contactProblem('anna@rug.nl', '06 12345678')).toBeNull();
  });

  it('needs at least one, and checks whichever is filled in', () => {
    expect(contactProblem('  ', '')).toMatch(/email or a whatsapp/i);
    expect(contactProblem('anna@', '')).toMatch(/email/i);
    expect(contactProblem('anna@rug.nl', '12')).toMatch(/number/i);
  });
});
