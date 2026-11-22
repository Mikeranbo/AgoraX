import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NOTICE_CHAPTERS, NOTICE_DATE_LINE, noticeMarkdown } from './privacyNotice';
import { CONTACT_EMAIL, NOTICE_VERSION } from '../config/pilot';

const FINAL = 'docs/PRIVACY_NOTICE_FINAL.md';

describe('privacy notice', () => {
  it('the app shows docs/PRIVACY_NOTICE_FINAL.md word for word', () => {
    // Windows checkouts with core.autocrlf=true have CRLF line endings; compare as LF.
    const doc = readFileSync(FINAL, 'utf8').replace(/\r\n/g, '\n');
    expect(noticeMarkdown()).toBe(doc);
  });

  it('names the current controller and version only', () => {
    const text = JSON.stringify(NOTICE_CHAPTERS);
    expect(text).toContain('Michael Aleinikov');
    expect(text).toContain(CONTACT_EMAIL);
    expect(text).not.toMatch(/sondarev|Nikita/i);
    expect(text).not.toContain('[To be confirmed');
    expect(NOTICE_DATE_LINE).toContain('1.2');
    expect(NOTICE_VERSION).toBe('1.2-2026-11-22');
  });

  it('never claims certification or approval', () => {
    expect(JSON.stringify(NOTICE_CHAPTERS)).not.toMatch(/GDPR[- ]certified|fully compliant|legally approved/i);
  });
});
