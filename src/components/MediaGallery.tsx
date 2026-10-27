import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { MediaItem, embedUrl } from '../data/media';

/**
 * A muted loop. It plays only while `active` (on screen, the current slide), never with reduced
 * motion, and stays paused once someone pauses it. The still underneath shows until it plays.
 */
export const LoopVideo = ({ item, active, sizes = '100vw', className = '', controls = false }: {
  item: MediaItem;
  active: boolean;
  sizes?: string;
  className?: string;
  /** Show the pause/play button (the gallery does; cards don't). */
  controls?: boolean;
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = !!useReducedMotion();
  const [stopped, setStopped] = useState(false);
  const [playing, setPlaying] = useState(false);
  const shouldPlay = active && !reduced && !stopped;

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (shouldPlay) void v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [shouldPlay]);

  return (
    <div className={`absolute inset-0 ${className}`}>
      {item.poster && <img src={item.poster} srcSet={item.posterSrcSet} sizes={sizes} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
      <video
        ref={ref}
        src={item.src}
        muted
        loop
        playsInline
        preload={active ? 'auto' : 'none'}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${playing ? 'opacity-100' : 'opacity-0'}`}
      />
      {controls && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (playing) setStopped(true);
            else {
              setStopped(false);
              void ref.current?.play().catch(() => undefined);
            }
          }}
          aria-label={playing ? 'Pause video' : 'Play video'}
          className="absolute right-3 bottom-[var(--gallery-chrome)] z-[2] grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/65"
        >
          {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" className="translate-x-px" />}
        </button>
      )}
    </div>
  );
};

/** YouTube or Vimeo: a still and a big play button; the player only loads once tapped. */
const Embed = ({ item, title }: { item: MediaItem; title: string }) => {
  const [on, setOn] = useState(false);
  if (on) {
    return (
      <iframe
        src={embedUrl(item)}
        title={`${title}: video`}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0 bg-black"
      />
    );
  }
  return (
    <button onClick={() => setOn(true)} aria-label={`Play the video about ${title}`} className="group absolute inset-0 grid place-items-center bg-[#0d1030]">
      {item.poster && <img src={item.poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80" />}
      <span className="relative grid size-16 place-items-center rounded-full bg-black/55 text-white ring-1 ring-white/40 backdrop-blur-sm transition-transform group-hover:scale-105 motion-reduce:transition-none">
        <Play size={28} aria-hidden="true" className="translate-x-0.5" />
      </span>
    </button>
  );
};

const FADE = 'linear-gradient(180deg, #000 0%, #000 62%, transparent 100%)';

/**
 * The opened event's media, edge to edge: swipe (or use the arrows and dots) through photos and
 * videos. `chrome` is how far up from the bottom the dots and credits sit, so the content card
 * that overlaps the gallery never covers them.
 */
export const MediaGallery = ({ items, title, emoji, accent, chrome, className = '' }: {
  items: MediaItem[];
  title: string;
  emoji?: string;
  accent?: string;
  /** px kept clear at the bottom for the overlapping card. */
  chrome: number;
  className?: string;
}) => {
  const strip = useRef<HTMLDivElement>(null);
  const reduced = !!useReducedMotion();
  const [index, setIndex] = useState(0);

  const goTo = (i: number) => {
    const el = strip.current;
    if (!el) return;
    const next = Math.max(0, Math.min(items.length - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
  };

  if (items.length === 0) {
    return (
      <div aria-hidden="true" className={`relative grid place-items-center ${className}`} style={{ backgroundColor: `color-mix(in srgb, ${accent ?? '#818cf8'} 55%, #0f172a)` }}>
        <span className="text-8xl">{emoji}</span>
      </div>
    );
  }

  const current = items[index];
  return (
    <section
      aria-roledescription="carousel"
      aria-label={`Photos and videos of ${title}`}
      className={`relative ${className}`}
      style={{ ['--gallery-chrome' as string]: `${chrome + 12}px` }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') goTo(index + 1);
        if (e.key === 'ArrowLeft') goTo(index - 1);
      }}
    >
      <div
        ref={strip}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
          if (i !== index) setIndex(i);
        }}
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        // The bottom fades out into the page, so the card that overlaps it reads as one piece with it.
        style={{ maskImage: FADE, WebkitMaskImage: FADE }}
      >
        {items.map((item, i) => (
          <div
            key={`${item.kind}-${item.src.slice(-60)}-${i}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${items.length}`}
            className="relative h-full w-full shrink-0 snap-center overflow-hidden bg-[#0d1030]"
          >
            {item.kind === 'image' ? (
              <img
                src={item.src}
                srcSet={item.srcSet}
                sizes="100vw"
                alt={`${title}, photo ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                // React 19 passes fetchPriority through as the fetchpriority attribute.
                fetchPriority={i === 0 ? 'high' : 'auto'}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : item.kind === 'video' ? (
              <LoopVideo item={item} active={i === index} controls />
            ) : (
              <Embed item={item} title={title} />
            )}
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28" style={{ background: 'linear-gradient(180deg, rgba(8,10,30,.55), transparent)' }} />

      {current?.credit && (
        <p className="absolute left-4 z-[2] max-w-[70%] truncate text-[11px] text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,.8)]" style={{ bottom: `${chrome + 50}px` }}>
          {current.link ? (
            <a href={current.link} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
              {current.credit}
            </a>
          ) : (
            current.credit
          )}
        </p>
      )}

      {items.length > 1 && (
        <>
          <div className="absolute inset-x-0 z-[2] flex justify-center" style={{ bottom: `${chrome + 10}px` }}>
            <div className="flex items-center gap-0.5 rounded-full bg-black/35 px-1.5 backdrop-blur-sm">
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Show ${item.kind === 'image' ? 'photo' : 'video'} ${i + 1} of ${items.length}`}
                  aria-current={i === index}
                  className="grid h-8 min-w-6 place-items-center"
                >
                  {item.kind === 'image' ? (
                    <span className={`block h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
                  ) : (
                    <Play size={11} aria-hidden="true" className={i === index ? 'fill-white text-white' : 'fill-white/50 text-white/50'} />
                  )}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous"
            className="absolute top-1/2 left-4 z-[2] hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 disabled:opacity-0 md:grid"
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button
            onClick={() => goTo(index + 1)}
            disabled={index === items.length - 1}
            aria-label="Next"
            className="absolute top-1/2 right-4 z-[2] hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 disabled:opacity-0 md:grid"
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </>
      )}
    </section>
  );
};
