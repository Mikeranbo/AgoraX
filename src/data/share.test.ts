import { describe, expect, it } from 'vitest';
import { acceptReferrer, buildShareUrl, resolveSource, shareCodeFor } from './share';

const params = (q: string) => new URLSearchParams(q);

describe('resolveSource', () => {
  it('cleans the poster id from ?src=', () => {
    expect(resolveSource(params('src=UB-Library!'), null)).toBe('ub-library');
  });

  it('keeps the first poster a phone ever came from', () => {
    expect(resolveSource(params('src=bernoulli'), 'poster-a')).toBe('poster-a');
  });

  it('credits a shared link when there is no poster id', () => {
    expect(resolveSource(params('ref=abc12345'), null)).toBe('share');
  });

  it('prefers the poster over the share when both are present', () => {
    expect(resolveSource(params('src=ub&ref=abc12345'), null)).toBe('ub');
  });

  it('falls back to direct', () => {
    expect(resolveSource(params(''), null)).toBe('direct');
    expect(resolveSource(params('src=!!!'), null)).toBe('direct');
  });
});

describe('share links', () => {
  it('uses the first 8 characters of the uid as the code', () => {
    expect(shareCodeFor('4MMylJaGYTV8ZBLF5suIFdxAVPn1')).toBe('4MMylJaG');
  });

  it('builds a link that opens the event and carries the code', () => {
    expect(buildShareUrl('https://agora-x.vercel.app', 'abc12345', 'chess-challenge')).toBe(
      'https://agora-x.vercel.app/?ref=abc12345&e=chess-challenge',
    );
  });

  it('encodes event ids that are not URL-safe', () => {
    expect(buildShareUrl('https://x.app/', 'abc12345', 'a b&c')).toBe('https://x.app/?ref=abc12345&e=a%20b%26c');
  });
});

describe('acceptReferrer', () => {
  it('ignores a visitor opening their own link', () => {
    expect(acceptReferrer('abc12345', 'abc12345')).toBeNull();
  });

  it('accepts another visitor’s code', () => {
    expect(acceptReferrer('xyz98765', 'abc12345')).toBe('xyz98765');
  });

  it('rejects empty or malformed codes', () => {
    expect(acceptReferrer(null, 'abc12345')).toBeNull();
    expect(acceptReferrer('', 'abc12345')).toBeNull();
    expect(acceptReferrer('<script>', 'abc12345')).toBeNull();
  });
});
