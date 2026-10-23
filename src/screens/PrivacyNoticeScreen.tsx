import React from 'react';
import { NOTICE_SECTIONS, NOTICE_STATUS } from '../data/privacyNotice';
import { ScreenTitle } from './SettingsScreens';

/** Placeholders stand out, so nobody mistakes the draft for the final notice. */
const Text = ({ children }: { children: string }) => {
  const parts = children.split(/(\[To be confirmed:[^\]]*\])/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('[To be confirmed') ? (
          <mark key={i} className="rounded bg-amber-300/15 px-1 text-amber-200">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
};

/** The privacy notice, reachable from the footer, the menu, the account menu and every form. */
export const PrivacyNoticeScreen = () => (
  <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6">
    <ScreenTitle>Privacy notice</ScreenTitle>
    {NOTICE_STATUS.draft && (
      <p role="note" className="mb-6 rounded-sheet border border-amber-300/40 bg-amber-300/10 p-4 text-[14px] leading-relaxed text-amber-100">
        <strong className="font-semibold">Draft ({NOTICE_STATUS.version}).</strong> {NOTICE_STATUS.note}
      </p>
    )}
    <div className="sheet space-y-8 rounded-sheet p-4 sm:p-6">
      {NOTICE_SECTIONS.map((s) => (
        <section key={s.title}>
          <h2 className="mb-2 font-display text-[22px] font-bold text-white">{s.title}</h2>
          <div className="max-w-[65ch] space-y-2 text-[15px] leading-relaxed text-slate-300">
            {s.paragraphs.map((p) => (
              <p key={p}>
                <Text>{p}</Text>
              </p>
            ))}
          </div>
          {s.table && (
            <dl className="mt-3 divide-y divide-sheet-line rounded-sheet border border-sheet-line">
              {s.table.map(([what, detail]) => (
                <div key={what} className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr] sm:gap-4">
                  <dt className="text-[14px] font-semibold text-white">{what}</dt>
                  <dd className="text-[14px] leading-relaxed text-slate-300">
                    <Text>{detail}</Text>
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
