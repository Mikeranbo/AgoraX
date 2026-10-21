import React, { useState } from 'react';
import type { Event } from '../types';

const DEFAULT_ACCENT = '#818cf8';

interface EventCoverProps {
  event: Pick<Event, 'imageUrls' | 'emoji' | 'accent' | 'title'>;
  /** 'card' for the grid, 'hero' for the detail page. */
  size?: 'card' | 'hero';
  className?: string;
  children?: React.ReactNode;
}

/**
 * A photo when the event has one that loads; otherwise a gradient built from the event's
 * accent colour with the emoji centred and large. A broken image is never shown.
 */
export const EventCover = ({ event, size = 'card', className = '', children }: EventCoverProps) => {
  const [failed, setFailed] = useState<string | null>(null);
  const url = event.imageUrls?.find((u) => u && u.trim() !== '');
  const showPhoto = !!url && failed !== url;
  const accent = event.accent || DEFAULT_ACCENT;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={
        showPhoto
          ? undefined
          : { background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 35%, #0f172a) 100%)` }
      }
    >
      {showPhoto ? (
        <img
          src={url}
          alt={event.title}
          loading="lazy"
          onError={() => setFailed(url!)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center select-none" aria-hidden="true">
          <span className={size === 'hero' ? 'text-8xl' : 'text-6xl'} style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.35))' }}>
            {event.emoji || '🎟️'}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/70 via-transparent to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
