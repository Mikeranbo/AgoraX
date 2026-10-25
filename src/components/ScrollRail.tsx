import React, { useEffect, useState } from 'react';

const HANDLE = 48;

/** A decorative scroll position on the right, in place of the hidden native scrollbar. */
export const ScrollRail = () => {
  const [state, setState] = useState({ progress: 0, scrollable: false, rail: 0 });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const max = root.scrollHeight - window.innerHeight;
      setState({ progress: max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0, scrollable: max > 8, rail: window.innerHeight - 24 });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // The page grows as events load; re-measure when the document changes size.
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      ro.disconnect();
    };
  }, []);

  if (!state.scrollable) return null;
  const top = state.progress * (state.rail - HANDLE);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed top-3 right-1.5 bottom-3 z-[45] w-1.5 rounded-full" style={{ background: 'rgba(255,255,255,.06)' }}>
      <div className="absolute inset-x-0 top-0 rounded-full" style={{ height: top + HANDLE / 2, background: 'rgba(138,107,232,.35)' }} />
      <div
        className="absolute -left-[3px] w-3 rounded-full"
        style={{
          top,
          height: HANDLE,
          background: 'linear-gradient(180deg, #8a6be8, #5b7be0)',
          boxShadow: '0 0 0 2px #10132b, 0 0 14px rgba(138,107,232,.55)',
        }}
      />
    </div>
  );
};
