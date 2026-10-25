import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useVisitor } from '../../state/VisitorProvider';
import { photoSet } from '../../data/photos';
import { Photo } from '../Photo';
import { Logo } from '../Logo';
import { CubeText } from './CubeText';
import { PilotNotice } from './PilotNotice';
import { ENTRY_MESSAGES, MOBILE_QUERY, ROLL_EVERY_MS, messageAt } from './entryContent';

const SLIDE = { duration: 1.05, ease: [0.7, 0, 0.2, 1] as const };

function useMobile(): boolean {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const on = () => setMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return mobile;
}

/** The photo panel: one photo per message, crossfading with the cube. */
const PhotoPanel = ({ active, mobile }: { active: number; mobile: boolean }) => (
  <div
    aria-hidden="true"
    className={`pointer-events-none absolute ${mobile ? 'inset-x-0 top-0 h-[40%]' : 'top-0 right-0 bottom-0 w-[34%]'}`}
    // The fades end in black; the edge facing the text also fades out, so the panel melts into
    // the page's own dark gradient instead of meeting it in a line.
    style={{
      maskImage: mobile ? 'linear-gradient(180deg, #000 82%, transparent 100%)' : 'linear-gradient(90deg, transparent 0%, #000 14%)',
      WebkitMaskImage: mobile ? 'linear-gradient(180deg, #000 82%, transparent 100%)' : 'linear-gradient(90deg, transparent 0%, #000 14%)',
    }}
  >
    {ENTRY_MESSAGES.map((m, i) => {
      const set = photoSet(m.photo);
      if (!set) return null;
      return (
        <div key={m.photo} className="absolute inset-0 transition-opacity duration-[800ms]" style={{ opacity: i === active ? 1 : 0 }}>
          <Photo
            set={set}
            sizes={`${MOBILE_QUERY} 100vw, 34vw`}
            priority={i === 0}
            className="h-full w-full object-cover"
            style={{ objectPosition: (mobile ? set.mobilePosition : set.position) ?? '50% 50%' }}
          />
        </div>
      );
    })}
    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(124,92,246,.5), rgba(47,110,255,.35))', mixBlendMode: 'soft-light' }} />
    <div
      className="absolute inset-0"
      style={{
        background: mobile
          ? 'linear-gradient(180deg, rgba(0,0,0,.85) 0%, transparent 35%, rgba(0,0,0,.25) 62%, #000 100%)'
          : 'linear-gradient(90deg, #000 0%, rgba(0,0,0,.55) 22%, transparent 55%), linear-gradient(180deg, #000 0%, rgba(0,0,0,.85) 22%, transparent 40%, transparent 60%, rgba(0,0,0,.85) 76%, #000 100%)',
      }}
    />
  </div>
);

/** Stage 1: three messages on a rolling cube. Wheel, swipe, drag, keys or the cue move on. */
const Intro = ({ onAdvance }: { onAdvance: () => void }) => {
  const mobile = useMobile();
  const reduced = !!useReducedMotion();
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const block = useRef<HTMLDivElement>(null);
  const [blockWidth, setBlockWidth] = useState(0);
  const [faceHeight, setFaceHeight] = useState(560);
  const advanced = useRef(false);
  const go = () => {
    if (advanced.current) return;
    advanced.current = true;
    onAdvance();
  };

  // The headline fills the block: width / 7.8 on wide screens (about 114px at 1440).
  useLayoutEffect(() => {
    const el = block.current;
    if (!el) return;
    const measure = () => {
      setBlockWidth(el.clientWidth);
      setFaceHeight(el.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mobile]);

  // Roll every 5.2s, except while someone is reading (hover/focus) or the tab is hidden.
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      if (!document.hidden) setStep((k) => k + 1);
    }, ROLL_EVERY_MS);
    return () => clearInterval(t);
  }, [paused, step]);

  // Moving on: wheel down past 80, a vertical swipe or drag over 50px, or the keyboard.
  useEffect(() => {
    let wheel = 0;
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;
    let startY: number | null = null;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY <= 0) return;
      wheel += e.deltaY;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => (wheel = 0), 400);
      if (wheel > 80) go();
    };
    const onDown = (e: PointerEvent) => (startY = e.clientY);
    const onUp = (e: PointerEvent) => {
      if (startY !== null && Math.abs(startY - e.clientY) > 50) go();
      startY = null;
    };
    const onTouchStart = (e: TouchEvent) => (startY = e.touches[0].clientY);
    const onTouchEnd = (e: TouchEvent) => {
      const y = e.changedTouches[0]?.clientY;
      if (startY !== null && y !== undefined && Math.abs(startY - y) > 50) go();
      startY = null;
    };
    const onKey = (e: KeyboardEvent) => {
      const onButton = (e.target as HTMLElement)?.closest('button');
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !onButton)) {
        e.preventDefault();
        go();
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(wheelTimer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const active = messageAt(step);
  // Jump to a message by rolling forward one or two faces.
  const show = (i: number) => setStep((k) => k + ((i - messageAt(k) + 3) % 3));
  const headlineSize = mobile ? 44 : Math.round(blockWidth / 7.8);

  return (
    <div
      className="absolute inset-0 overflow-hidden select-none"
      style={{
        background:
          'radial-gradient(60% 70% at 25% 55%, rgba(70,60,180,.22), transparent 70%), linear-gradient(110deg, #000 0%, #060716 55%, #000 100%)',
        touchAction: 'none',
      }}
    >
      <PhotoPanel active={active} mobile={mobile} />

      <header className={`absolute inset-x-0 top-8 z-10 flex items-center justify-between ${mobile ? 'px-5' : 'px-12'}`}>
        <p>
          <Logo />
        </p>
        <div className="flex" role="group" aria-label="Messages" onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
          {ENTRY_MESSAGES.map((m, i) => (
            <button
              key={m.photo}
              onClick={() => show(i)}
              aria-label={`Show message ${i + 1} of 3`}
              aria-pressed={i === active}
              className="grid h-11 w-8 place-items-center rounded-full"
            >
              <span
                className="block h-1 rounded-full transition-all duration-500"
                style={{ width: i === active ? 22 : 8, background: i === active ? '#fff' : 'rgba(255,255,255,.35)' }}
              />
            </button>
          ))}
        </div>
      </header>

      <div
        ref={block}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="absolute"
        style={
          mobile
            ? { left: 20, right: 20, top: '64%', transform: 'translateY(-50%)', height: 'min(480px, calc(100dvh - 190px))' }
            : { left: '5%', width: '62vw', top: '50%', transform: 'translateY(-50%)', height: 560 }
        }
      >
        <CubeText step={step} height={faceHeight} headlineSize={headlineSize} bodySize={mobile ? 18 : 28} centred={mobile} reduced={reduced} />
      </div>

      <button
        onClick={go}
        className="absolute bottom-9 left-1/2 z-10 inline-flex min-h-12 -translate-x-1/2 items-center gap-2 rounded-full whitespace-nowrap border border-white/30 px-5 text-[15px] font-extrabold text-white backdrop-blur-[8px]"
        style={{ background: 'rgba(12,14,40,.35)', fontFamily: 'var(--font-brand)' }}
      >
        {mobile ? 'Swipe up to explore' : 'Scroll to explore'}
        <ChevronDown size={18} aria-hidden="true" />
      </button>
    </div>
  );
};

/**
 * The way in: the opening messages (stage 1), then the pilot notice over the blurred events page
 * (stage 2), then the page itself. Only the notice's buttons close the notice; scrolling can't.
 */
export const EntryFlow = () => {
  const { state, actions } = useVisitor();
  const reduced = !!useReducedMotion();
  const stage = state.entry;

  // The page underneath doesn't scroll while either stage is up.
  useEffect(() => {
    if (stage === 'done') return;
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = before;
    };
  }, [stage]);

  return (
    <>
      <AnimatePresence>
        {stage === 'intro' && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-[120]"
            initial={false}
            exit={{ y: '-100%' }}
            transition={reduced ? { duration: 0.3 } : SLIDE}
          >
            <Intro onAdvance={actions.advanceEntry} />
          </motion.div>
        )}
      </AnimatePresence>
      <PilotNotice open={stage === 'notice'} onClose={actions.closePilotNotice} reduced={reduced} />
    </>
  );
};
