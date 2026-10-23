import { describe, expect, it } from 'vitest';
import { AVATAR_LIMITS, COVER_LIMITS, imageFileProblem } from './images';

describe('imageFileProblem', () => {
  it('accepts JPEG, PNG and WebP up to 10 MB', () => {
    expect(imageFileProblem({ type: 'image/jpeg', size: 3_000_000 })).toBeNull();
    expect(imageFileProblem({ type: 'image/png', size: 10 * 1024 * 1024 })).toBeNull();
    expect(imageFileProblem({ type: 'image/webp', size: 1 })).toBeNull();
  });

  it('refuses other formats, including SVG and GIF', () => {
    expect(imageFileProblem({ type: 'image/svg+xml', size: 100 })).toMatch(/JPEG, PNG or WebP/);
    expect(imageFileProblem({ type: 'image/gif', size: 100 })).toMatch(/JPEG, PNG or WebP/);
    expect(imageFileProblem({ type: 'application/pdf', size: 100 })).toMatch(/JPEG, PNG or WebP/);
    expect(imageFileProblem({ type: '', size: 100 })).toMatch(/JPEG, PNG or WebP/);
  });

  it('refuses files over 10 MB and empty files', () => {
    expect(imageFileProblem({ type: 'image/jpeg', size: 10 * 1024 * 1024 + 1 })).toMatch(/over 10 MB/);
    expect(imageFileProblem({ type: 'image/jpeg', size: 0 })).toMatch(/empty/);
  });

  it('keeps compressed sizes under the limits the rules enforce', () => {
    expect(AVATAR_LIMITS.maxChars).toBeLessThan(60_000);
    expect(COVER_LIMITS.maxChars).toBeLessThan(200_000);
    expect(AVATAR_LIMITS.square).toBe(true);
  });
});
