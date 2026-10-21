import React, { useRef } from 'react';
import { Modal } from './Modal';
import { Event, PriceAnswer } from '../types';

export interface LadderPrompt {
  event: Event;
  nextPrice: number;
}

interface PriceLadderSheetProps {
  prompt: LadderPrompt | null;
  onAnswer: (prompt: LadderPrompt, answer: PriceAnswer) => void;
  onSkip: () => void;
}

const OPTIONS: { value: PriceAnswer; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'depends', label: 'Depends' },
];

/** Never blocks the join — the person is already in when this slides up. */
export const PriceLadderSheet = ({ prompt, onAnswer, onSkip }: PriceLadderSheetProps) => {
  const last = useRef<LadderPrompt | null>(prompt);
  if (prompt) last.current = prompt;
  const shown = prompt ?? last.current;

  return (
    <Modal isOpen={!!prompt} onClose={onSkip} title="One quick question">
      {shown && (
        <div>
          <p className="text-slate-400 text-xs mb-2">{shown.event.emoji} {shown.event.title}</p>
          <p className="text-white text-xl font-display font-black leading-snug mb-6">
            Would you still come if it were €{shown.nextPrice}?
          </p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => onAnswer(shown, o.value)}
                className="py-3 glass rounded-2xl font-bold text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                {o.label}
              </button>
            ))}
          </div>
          <button onClick={onSkip} className="w-full py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors">
            Skip
          </button>
        </div>
      )}
    </Modal>
  );
};
