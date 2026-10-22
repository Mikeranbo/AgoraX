import { describe, expect, it } from 'vitest';
import { splitContact, validateHelperForm, validateVenueOffer } from './forms';

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
