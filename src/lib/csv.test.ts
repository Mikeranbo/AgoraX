import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

const rows = (cells: unknown[]) => toCsv(['v'], cells.map((c) => [c])).split('\r\n').slice(1);

describe('csv', () => {
  it('neutralises spreadsheet formulas typed by visitors', () => {
    expect(rows(['=1+1', '@SUM(A1)', '+cmd|calc'])).toEqual(["'=1+1", "'@SUM(A1)", "'+cmd|calc"]);
  });

  it('leaves phone numbers and negative numbers alone', () => {
    expect(rows(['+31612345678', '-5', -5])).toEqual(['+31612345678', '-5', '-5']);
  });

  it('quotes commas, quotes and line breaks', () => {
    expect(rows(['a,b', 'say "hi"', 'line\nbreak'])).toEqual(['"a,b"', '"say ""hi"""', '"line\nbreak"']);
  });

  it('writes empty cells for missing values', () => {
    expect(rows([null, undefined])).toEqual(['', '']);
  });
});
