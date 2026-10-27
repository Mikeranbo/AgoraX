/**
 * Photos served from this site (public/images), never hotlinked: the opening screen's cut-outs, as
 * AVIF and WebP at fixed widths plus a transparent PNG. scripts/build-photos.mjs makes them from the
 * Unsplash originals in scripts/photo-sources.json and credits them in public/images/CREDITS.md.
 * Event galleries live in data/media.ts.
 */
import { PHOTO_MANIFEST, PhotoInfo } from './photoManifest';

export interface PhotoSet {
  avif: string;
  webp: string;
  /** A plain WebP URL for places that need one URL. */
  fallback: string;
  width: number;
  height: number;
  position?: string;
  mobilePosition?: string;
  /** Cut-outs only: a small transparent WebP whose shape masks the gradient silhouette behind. */
  mask?: string;
}

const url = (key: string, info: PhotoInfo, w: number, ext: 'avif' | 'webp') => `/images/${info.dir}/${key}-${w}.${ext}`;

/** The srcset pair for a photo in the manifest, or undefined when there is none. */
export function photoSet(key?: string): PhotoSet | undefined {
  const info = key ? PHOTO_MANIFEST[key] : undefined;
  if (!key || !info) return undefined;
  const srcset = (ext: 'avif' | 'webp') => info.widths.map((w) => `${url(key, info, w, ext)} ${w}w`).join(', ');
  const middle = info.widths.find((w) => w >= 1280) ?? info.widths[info.widths.length - 1];
  return {
    avif: srcset('avif'),
    webp: srcset('webp'),
    // A cut-out falls back to its transparent PNG.
    fallback: info.cutout ? `/images/${info.dir}/${key}.png` : url(key, info, middle, 'webp'),
    ...(info.cutout ? { mask: url(key, info, info.widths.find((w) => w >= 800) ?? info.widths[info.widths.length - 1], 'webp') } : {}),
    width: info.width,
    height: info.height,
    position: info.position,
    mobilePosition: info.mobilePosition,
  };
}

/** The small WebP of a seed photo, for thumbnails such as the photo picker's ideas. */
export function seedThumb(slug?: string): string | undefined {
  const info = slug ? PHOTO_MANIFEST[slug] : undefined;
  return slug && info ? url(slug, info, info.widths[0], 'webp') : undefined;
}
