import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import type { Event } from '../types';
import { hasEnough } from '../data/progress';

// Filled places shade from progress indigo (#818cf8) to progress cyan (#22d3ee).
const FROM = [0x81, 0x8c, 0xf8];
const TO = [0x22, 0xd3, 0xee];

function placeColour(i: number, n: number): string {
  const t = n <= 1 ? 0 : i / (n - 1);
  return `rgb(${FROM.map((f, k) => Math.round(f + (TO[k] - f) * t)).join(' ')})`;
}

/** Places fill once per visit: the first time a list is on screen. */
const filledThisVisit = new Set<string>();

function useCountUp(target: number, enabled: boolean): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (!enabled) {
      setValue(target);
      from.current = target;
      return;
    }
    const controls = animate(from.current, target, {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    from.current = target;
    return () => controls.stop();
  }, [target, enabled]);
  return value;
}

/** Close to its minimum: three or fewer places left, or three quarters full. */
export function isCloseToMinimum(e: Pick<Event, 'minParticipants' | 'participantsCount' | 'status'>): boolean {
  const count = e.participantsCount || 0;
  const left = e.minParticipants - count;
  return !hasEnough(e) && left > 0 && (left <= 3 || count / e.minParticipants >= 0.75);
}

/**
 * The event's minimum drawn as numbered places, like the sign-up sheet on an association door.
 * Up to 12 places sit on one line; bigger lists wrap in rows of 10.
 */
export const SignupList = ({ event, joined }: { event: Event; joined: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const count = Math.max(0, event.participantsCount || 0);
  const min = Math.max(1, event.minParticipants || 1);
  const running = hasEnough(event);

  const [armed] = useState(() => !reduced && !filledThisVisit.has(event.id));
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const started = !armed || inView;
  useEffect(() => {
    if (inView) filledThisVisit.add(event.id);
  }, [inView, event.id]);

  const joinedAtMount = useRef(joined);
  const shown = useCountUp(started ? count : 0, armed);
  const filled = Math.min(shown, min);
  const left = Math.max(0, min - shown);
  const cols = min <= 12 ? min : 10;
  const step = reduced ? 0 : Math.min(35, 600 / min);

  return (
    <div>
      <div
        ref={ref}
        role="img"
        aria-label={`${count} of ${min} places taken${joined ? ', including yours' : ''}`}
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: cols * 30 + (cols - 1) * 4 }}
      >
        {Array.from({ length: min }, (_, i) => {
          const isFilled = running || i < filled;
          const isYou = joined && !running && count <= min && i === count - 1 && started;
          const background = running
            ? 'var(--color-happening)'
            : isYou
              ? 'var(--color-brand-action)'
              : isFilled
                ? placeColour(i, min)
                : 'transparent';
          return (
            <span
              key={i}
              className="grid h-6 place-items-center border font-display text-[12px] leading-none tabular-nums text-slate-400"
              style={{
                backgroundColor: background,
                borderColor: isFilled || isYou ? 'transparent' : 'rgb(148 163 184 / 0.45)',
                transition: `background-color 260ms ease-out ${i * step}ms, border-color 260ms ease-out ${i * step}ms`,
              }}
            >
              {isYou ? (
                <motion.span
                  initial={joinedAtMount.current ? false : { scale: 1.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Check size={14} strokeWidth={3} className="text-white" />
                </motion.span>
              ) : (
                !isFilled && i + 1
              )}
            </span>
          );
        })}
      </div>

      <p className="mt-2.5 text-[15px] leading-snug text-slate-300 tabular-nums">
        {running ? (
          <>
            <span className="font-display text-[17px] font-bold text-happening-ink">This is happening</span>
            <span> · {shown} signed up</span>
            {count > min && <span className="text-slate-400"> · +{count - min} after it filled</span>}
          </>
        ) : isCloseToMinimum(event) ? (
          <>
            <strong className="font-display text-[18px] font-bold text-white">{left} more</strong>
            <span className="text-white"> and this runs</span>
            <span className="text-slate-400"> · {shown} of {min}</span>
          </>
        ) : (
          <>
            <span className="font-display font-bold text-white">
              {shown} of {min}
            </span>{' '}
            — {left} more and this runs
          </>
        )}
      </p>
    </div>
  );
};
