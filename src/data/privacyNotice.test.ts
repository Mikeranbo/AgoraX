import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NOTICE_SECTIONS, NOTICE_STATUS } from './privacyNotice';

const DOC = 'docs/PRIVACY_NOTICE_DRAFT.md';
const START = '<!-- notice:start (generated from src/data/privacyNotice.ts; run UPDATE_NOTICE=1 npx vitest run src/data/privacyNotice.test.ts) -->';
const END = '<!-- notice:end -->';

/** The notice as Markdown, exactly as the app shows it. */
export function noticeMarkdown(): string {
  const out = [`> **Draft (${NOTICE_STATUS.version}).** ${NOTICE_STATUS.note}`, ''];
  for (const s of NOTICE_SECTIONS) {
    out.push(`### ${s.title}`, '');
    s.paragraphs.forEach((p) => out.push(p, ''));
    if (s.table) {
      out.push('| | |', '| --- | --- |');
      s.table.forEach(([what, detail]) => out.push(`| ${what} | ${detail.replace(/\|/g, '\\|')} |`));
      out.push('');
    }
  }
  return out.join('\n').trim();
}

describe('privacy notice', () => {
  it('the review document carries the same text the app shows', () => {
    // Windows checkouts with core.autocrlf=true have CRLF line endings; compare as LF.
    const doc = readFileSync(DOC, 'utf8').replace(/\r\n/g, '\n');
    const block = `${START}\n${noticeMarkdown()}\n${END}`;
    if (process.env.UPDATE_NOTICE) {
      const before = doc.slice(0, doc.indexOf(START));
      const after = doc.slice(doc.indexOf(END) + END.length);
      writeFileSync(DOC, before + block + after);
      return;
    }
    expect(doc).toContain(block);
  });

  it('stays marked as a draft while any fact is still to be confirmed', () => {
    const open = JSON.stringify(NOTICE_SECTIONS).includes('[To be confirmed');
    if (open) expect(NOTICE_STATUS.draft).toBe(true);
  });

  it('never claims certification or approval', () => {
    expect(JSON.stringify(NOTICE_SECTIONS)).not.toMatch(/GDPR[- ]certified|fully compliant|legally approved/i);
  });
});
