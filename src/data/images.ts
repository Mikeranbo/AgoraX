import { SEED_EVENTS } from './seedEvents';
import { seedPhoto } from './photos';

/** A picture someone can pick for a proposed event. */
export interface PhotoChoice {
  /** What is shown in the picker. */
  thumb: string;
  /** What gets saved: a URL, or (for Openverse) the thumb re-encoded on pick. */
  src: string;
  /** "Photo: Jane Doe, CC BY" when the licence asks for credit. */
  credit?: string;
  /** Openverse pictures are copied into the proposal so they never depend on a third-party link. */
  copy?: boolean;
}

/** The longest image string a proposal may carry (Firestore rules allow 200 000 characters). */
export const MAX_IMAGE_CHARS = 180_000;

function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image did not load'));
    img.src = src;
  });
}

/**
 * Shrinks a picture to a JPEG data URL small enough to live inside a Firestore document,
 * so uploads need no separate file storage. Starts at 1000px wide and steps down quality,
 * then size, until it fits.
 */
export async function compressToDataUrl(source: File | string, crossOrigin = false): Promise<string> {
  const objectUrl = typeof source === 'string' ? null : URL.createObjectURL(source);
  try {
    const img = await loadImage(objectUrl ?? (source as string), crossOrigin);
    let width = Math.min(1000, img.naturalWidth || 1000);
    for (let attempt = 0; attempt < 6; attempt++) {
      const height = Math.round((width / (img.naturalWidth || width)) * (img.naturalHeight || width));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      for (const quality of [0.8, 0.7, 0.6]) {
        const url = canvas.toDataURL('image/jpeg', quality);
        if (url.length <= MAX_IMAGE_CHARS) return url;
      }
      width = Math.round(width * 0.8);
    }
    throw new Error('image too large');
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

/** Resolves when an https picture link actually loads, so a broken link is caught before sending. */
export async function checkImageLink(url: string): Promise<void> {
  if (!/^https:\/\/\S+$/.test(url.trim())) throw new Error('not an https link');
  await loadImage(url.trim());
}

/** Our own photos of similar events, by category. */
export function photosForCategory(category: string): PhotoChoice[] {
  return SEED_EVENTS.filter((e) => e.category === category)
    .map((e) => seedPhoto(e.slug, 800))
    .filter((u): u is string => !!u)
    .map((u) => ({ thumb: u.replace('w=800', 'w=320'), src: u }));
}

const LICENCE_NAMES: Record<string, string> = { by: 'CC BY', cc0: 'CC0', pdm: 'public domain' };

/**
 * Free pictures from Openverse (openverse.org), matched to what the person is proposing.
 * Only licences that allow any use: public domain, CC0, and CC BY (credit kept with the picture).
 */
export async function searchOpenverse(query: string, page = 1): Promise<PhotoChoice[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license=by,cc0,pdm&aspect_ratio=wide&mature=false&page_size=9&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`openverse ${res.status}`);
  const data = (await res.json()) as { results?: { thumbnail: string; creator?: string; license: string }[] };
  return (data.results ?? []).map((r) => ({
    thumb: r.thumbnail,
    src: r.thumbnail,
    copy: true,
    credit: r.license === 'by' ? `Photo: ${r.creator?.trim() || 'unknown'}, ${LICENCE_NAMES.by}` : undefined,
  }));
}
