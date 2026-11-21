import React from 'react';
import { NOTICE_CHAPTERS, NOTICE_DATE_LINE, NOTICE_INTRO, NOTICE_TITLE, NoticeBlock } from '../data/privacyNotice';
import { ScreenTitle } from './SettingsScreens';

/** Legal text with **bold** spans. Single line breaks are kept (the controller address). */
export const NoticeText = ({ children }: { children: string }) => {
  const parts = children.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
};

/** One row per line of the table. Wider tables (the processors) label each extra column. */
const NoticeTable = ({ head, rows }: { head: string[]; rows: string[][] }) => (
  <dl className="mt-3 divide-y divide-sheet-line rounded-sheet border border-sheet-line">
    <div className="hidden gap-4 px-4 py-2 text-[12px] font-semibold tracking-wide text-slate-400 uppercase sm:grid sm:grid-cols-[14rem_1fr]">
      <span>{head[0]}</span>
      <span>{head.length === 2 ? head[1] : ''}</span>
    </div>
    {rows.map((row) => (
      <div key={row[0]} className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr] sm:gap-4">
        <dt className="text-[14px] font-semibold text-white">
          <NoticeText>{row[0]}</NoticeText>
        </dt>
        <dd className="space-y-1.5 text-[14px] leading-relaxed text-slate-300">
          {head.length === 2 ? (
            <NoticeText>{row[1]}</NoticeText>
          ) : (
            row.slice(1).map((cell, i) => (
              <p key={head[i + 1]}>
                <span className="text-slate-400">{head[i + 1]}: </span>
                <NoticeText>{cell}</NoticeText>
              </p>
            ))
          )}
        </dd>
      </div>
    ))}
  </dl>
);

const Block = ({ block }: { block: NoticeBlock }) => {
  if (block.kind === 'table') return <NoticeTable head={block.head} rows={block.rows} />;
  if (block.kind === 'list')
    return (
      <ul className="list-disc space-y-1 pl-5">
        {block.items.map((item) => (
          <li key={item}>
            <NoticeText>{item}</NoticeText>
          </li>
        ))}
      </ul>
    );
  return (
    <p className="whitespace-pre-line">
      <NoticeText>{block.text}</NoticeText>
    </p>
  );
};

/** The privacy notice (version 1.1), reachable from the footer, Privacy & my data and every form. */
export const PrivacyNoticeScreen = () => (
  <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6">
    <ScreenTitle>{NOTICE_TITLE}</ScreenTitle>
    <p className="-mt-3 mb-6 text-[14px] text-slate-400">{NOTICE_DATE_LINE}</p>
    <div className="sheet space-y-8 rounded-sheet p-4 sm:p-6">
      <div className="max-w-[65ch] space-y-2 text-[15px] leading-relaxed text-slate-200">
        {NOTICE_INTRO.map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </div>
      {NOTICE_CHAPTERS.map((c) => (
        <section key={c.title}>
          <h2 className="mb-2 font-display text-[22px] font-bold text-white">{c.title}</h2>
          <div className="max-w-[65ch] space-y-3 text-[15px] leading-relaxed text-slate-300">
            {c.blocks.map((b, i) => (
              <Block key={i} block={b} />
            ))}
          </div>
        </section>
      ))}
    </div>
  </div>
);
