import React from 'react';
import { COOKIES, LEGAL_DOCS_VERSION, TERMS } from '../data/legalDocs';
import { ScreenTitle } from './SettingsScreens';
import { NoticeText } from './PrivacyNoticeScreen';

const DOCS = { terms: TERMS, cookies: COOKIES } as const;

/** Terms of Use or Cookie Policy: a draft until reviewed, with its open points marked. */
export const LegalDocScreen = ({ doc }: { doc: keyof typeof DOCS }) => {
  const d = DOCS[doc];
  return (
    <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6">
      <ScreenTitle>{d.title}</ScreenTitle>
      <p className="-mt-3 mb-6 text-[14px] text-slate-400">Version {LEGAL_DOCS_VERSION}</p>
      <div className="sheet space-y-8 rounded-sheet p-4 sm:p-6">
        <p className="max-w-[65ch] text-[15px] leading-relaxed text-slate-200">{d.intro}</p>
        {d.sections.map((s) => (
          <section key={s.title}>
            <h2 className="mb-2 font-display text-[22px] font-bold text-white">{s.title}</h2>
            <div className="max-w-[65ch] space-y-2 text-[15px] leading-relaxed text-slate-300">
              {s.paragraphs.map((p) => (
                <p key={p}>
                  <NoticeText>{p}</NoticeText>
                </p>
              ))}
            </div>
            {s.table && (
              <dl className="mt-3 divide-y divide-sheet-line rounded-sheet border border-sheet-line">
                {s.table.map(([what, detail]) => (
                  <div key={what} className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr] sm:gap-4">
                    <dt className="text-[14px] font-semibold text-white">{what}</dt>
                    <dd className="text-[14px] leading-relaxed text-slate-300">
                      <NoticeText>{detail}</NoticeText>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};
