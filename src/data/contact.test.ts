import { describe, expect, it } from 'vitest';
import { maskPhone, normaliseEmail, normalisePhone } from './contact';

describe('normalisePhone', () => {
  it('turns every common Dutch way of typing a number into one form', () => {
    expect(normalisePhone('06 1234 5678')).toBe('+31612345678');
    expect(normalisePhone('+31 6 1234 5678')).toBe('+31612345678');
    expect(normalisePhone('0031612345678')).toBe('+31612345678');
    expect(normalisePhone('(06) 12-34-56-78')).toBe('+31612345678');
  });

  it('keeps foreign numbers with a country code', () => {
    expect(normalisePhone('+49 151 12345678')).toBe('+4915112345678');
  });

  it('returns an empty string for nothing', () => {
    expect(normalisePhone(undefined)).toBe('');
    expect(normalisePhone('   ')).toBe('');
  });
});

describe('maskPhone', () => {
  it('shows only the start, as My picks does (APP_CHANGES §8)', () => {
    expect(maskPhone('+31612345678')).toBe('+31 6…');
    expect(maskPhone('+4915112345678')).toBe('+49 1…');
  });

  it('masks a number without a country code too', () => {
    expect(maskPhone('612345678')).toBe('61…');
    expect(maskPhone('')).toBe('');
  });
});

describe('normaliseEmail', () => {
  it('trims and lowercases', () => {
    expect(normaliseEmail('  Anna@RUG.nl ')).toBe('anna@rug.nl');
  });
});
