/**
 * Photos served from this site (public/images), never hotlinked. Each seed event and each entry
 * message has a set of AVIF and WebP files at fixed widths; scripts/build-photos.mjs makes them
 * from the Unsplash originals listed in scripts/photo-sources.json and credits them in
 * public/images/CREDITS.md. An event's own imageUrls, set in /admin or a proposal, always win.
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

/** The event's own first photo (an https link or an uploaded data URL), if it has one. */
export function ownPhoto(e: { imageUrls?: string[] }): string | undefined {
  return e.imageUrls?.find((u) => u && u.trim() !== '');
}

/** A single URL for the event's photo: its own, else its local seed photo. */
export function photoFor(e: { imageUrls?: string[]; slug?: string }): string | undefined {
  return ownPhoto(e) ?? photoSet(e.slug)?.fallback;
}

/** The small WebP of a seed photo, for thumbnails such as the photo picker's ideas. */
export function seedThumb(slug?: string): string | undefined {
  const info = slug ? PHOTO_MANIFEST[slug] : undefined;
  return slug && info ? url(slug, info, info.widths[0], 'webp') : undefined;
}
