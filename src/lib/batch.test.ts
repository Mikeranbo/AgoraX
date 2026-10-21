import { describe, expect, it } from 'vitest';
import { chunk } from './batch';

describe('chunk', () => {
  it('splits under the Firestore 500-writes-per-batch limit', () => {
    const items = Array.from({ length: 1001 }, (_, i) => i);
    const parts = chunk(items, 450);
    expect(parts.map((p) => p.length)).toEqual([450, 450, 101]);
    expect(parts.flat()).toEqual(items);
  });

  it('returns no chunks for an empty list', () => {
    expect(chunk([], 450)).toEqual([]);
  });

  it('rejects a size below 1 instead of looping forever', () => {
    expect(() => chunk([1, 2], 0)).toThrow();
  });
});
