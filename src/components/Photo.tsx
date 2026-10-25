import React from 'react';
import { PhotoSet } from '../data/photos';

interface PhotoProps {
  set: PhotoSet;
  /** Which width the browser should pick, e.g. "(min-width: 1024px) 30vw, 100vw". */
  sizes: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Above the fold: load first and eagerly. Everything else is lazy. */
  priority?: boolean;
  onError?: () => void;
}

/** A local photo as <picture>: AVIF first, WebP otherwise, with real width and height. */
export const Photo = ({ set, sizes, alt = '', className = '', style, priority = false, onError }: PhotoProps) => (
  <picture>
    <source type="image/avif" srcSet={set.avif} sizes={sizes} />
    <source type="image/webp" srcSet={set.webp} sizes={sizes} />
    <img
      src={set.fallback}
      alt={alt}
      width={set.width}
      height={set.height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      // React 19 passes fetchPriority through as the fetchpriority attribute.
      fetchPriority={priority ? 'high' : 'auto'}
      onError={onError}
      className={className}
      style={style}
    />
  </picture>
);
