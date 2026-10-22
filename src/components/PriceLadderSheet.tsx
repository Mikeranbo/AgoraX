import React, { useRef } from 'react';
import { Modal } from './Modal';
import { Event, PriceAnswer } from '../types';
import { useVisitor } from '../state/VisitorProvider';

export interface LadderPrompt {
  event: Event;
  nextPrice: number;
}

const OPTIONS: { value: PriceAnswer; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'depends', label: 'Depends' },
];

/** Slides up after a join. The person is already in, so skipping costs nothing. */
export const PriceLadderSheet = () => {
  const { state, actions } = useVisitor();
  const prompt = state.ladder;
  const last = useRef<LadderPrompt | null>(prompt);
  if (prompt) last.current = prompt;
  const shown = prompt ?? last.current;

  return (
    <Modal isOpen={!!prompt} onClose={actions.skipLadder} title="One quick question">
      {shown && (
        <div>
          <p className="mb-1 text-[15px] text-slate-400">
            {shown.event.emoji} {shown.event.title}
          </p>
          <p className="mb-6 font-display text-[22px] font-bold leading-snug text-white">
            Would you still come if it were €{shown.nextPrice}?
          </p>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => actions.answerLadder(shown, o.value)}
                className="min-h-12 rounded-sheet border border-sheet-line bg-brand-dark font-display text-[17px] font-bold text-white hover:border-brand-primary"
              >
                {o.label}
              </button>
            ))}
          </div>
          <button onClick={actions.skipLadder} className="min-h-11 w-full text-[15px] font-semibold text-slate-400 hover:text-white">
            Skip
          </button>
        </div>
      )}
    </Modal>
  );
};
