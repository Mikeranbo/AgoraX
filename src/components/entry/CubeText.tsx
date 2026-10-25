import React from 'react';
import { ENTRY_MESSAGES, EntryMessage, messageAt } from './entryContent';

const ROLL = 'transform 1.35s cubic-bezier(.7,-0.2,.25,1.15)';

const Message = ({ message, headlineSize, bodySize, centred, front }: {
  message: EntryMessage;
  headlineSize: number;
  bodySize: number;
  centred: boolean;
  front: boolean;
}) => {
  const [before, highlight, after] = message.headline;
  // Only the face you can read is the page heading; the others are hidden from assistive tech.
  const Heading = front ? 'h1' : 'p';
  return (
    <div className={`flex h-full flex-col justify-center ${centred ? 'items-center text-center' : ''}`}>
      <Heading className="entry-headline text-white" style={{ fontSize: headlineSize }}>
        {before}
        <span className="entry-highlight">{highlight}</span>
        {after}
      </Heading>
      <p
        className="max-w-[820px] font-medium text-x-text"
        style={{ fontFamily: 'var(--font-entry)', fontSize: bodySize, lineHeight: 1.4, marginTop: centred ? 20 : 30 }}
      >
        {message.body}
      </p>
    </div>
  );
};

/**
 * One invisible cube rolling around the X axis; each face holds a whole message (headline and
 * text together). Four faces carry three messages, so the face opposite the front is the one
 * that gets refilled. The text is flat while still and only moves during the roll.
 * With reduced motion the messages crossfade instead.
 */
export const CubeText = ({ step, height, headlineSize, bodySize, centred, reduced }: {
  /** Cube position k: increases by one per roll. */
  step: number;
  height: number;
  headlineSize: number;
  bodySize: number;
  centred: boolean;
  reduced: boolean;
}) => {
  if (reduced) {
    return (
      <div className="relative h-full">
        {ENTRY_MESSAGES.map((m, i) => {
          const front = i === messageAt(step);
          return (
            <div key={i} aria-hidden={!front} className="absolute inset-0 transition-opacity duration-[800ms]" style={{ opacity: front ? 1 : 0 }}>
              <Message message={m} headlineSize={headlineSize} bodySize={bodySize} centred={centred} front={front} />
            </div>
          );
        })}
      </div>
    );
  }

  const depth = height / 2;
  return (
    <div className="relative h-full" style={{ perspective: '1000px' }}>
      <div
        className="relative h-full"
        style={{ transformStyle: 'preserve-3d', transform: `translateZ(-${depth}px) rotateX(${step * 90}deg)`, transition: ROLL }}
      >
        {[0, 1, 2, 3].map((j) => {
          const off = (j - (step % 4) + 4) % 4;
          const message = off === 0 ? step : off === 1 ? step + 1 : off === 2 ? step + 2 : step - 1;
          return (
            <div
              key={j}
              aria-hidden={off !== 0}
              className="absolute inset-0"
              style={{
                transform: `rotateX(${-j * 90}deg) translateZ(${depth}px)`,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                opacity: off === 0 ? 1 : off === 2 ? 0 : 0.4,
                transition: 'opacity 0.9s',
              }}
            >
              <Message message={ENTRY_MESSAGES[messageAt(message)]} headlineSize={headlineSize} bodySize={bodySize} centred={centred} front={off === 0} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
