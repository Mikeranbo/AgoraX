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

export interface CompressOptions {
  /** Widest the result may be, in px. */
  maxWidth?: number;
  /** Longest the data URL may be (the Firestore rules check the same limit). */
  maxChars?: number;
  /** Crop to a centred square first (profile pictures). */
  square?: boolean;
}

/**
 * Shrinks a picture to a JPEG data URL small enough to live inside a Firestore document,
 * so uploads need no separate file storage. Starts at `maxWidth` and steps down quality,
 * then size, until it fits.
 */
export async function compressToDataUrl(source: File | string, crossOrigin = false, options: CompressOptions = {}): Promise<string> {
  const { maxWidth = 1000, maxChars = MAX_IMAGE_CHARS, square = false } = options;
  const objectUrl = typeof source === 'string' ? null : URL.createObjectURL(source);
  try {
    const img = await loadImage(objectUrl ?? (source as string), crossOrigin);
    const naturalW = img.naturalWidth || maxWidth;
    const naturalH = img.naturalHeight || maxWidth;
    // The source rectangle: the whole picture, or its centred square.
    const side = Math.min(naturalW, naturalH);
    const src = square
      ? { x: (naturalW - side) / 2, y: (naturalH - side) / 2, w: side, h: side }
      : { x: 0, y: 0, w: naturalW, h: naturalH };
    let width = Math.min(maxWidth, src.w);
    for (let attempt = 0; attempt < 6; attempt++) {
      const height = Math.round((width / src.w) * src.h);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, src.x, src.y, src.w, src.h, 0, 0, width, height);
      for (const quality of [0.8, 0.7, 0.6]) {
        const url = canvas.toDataURL('image/jpeg', quality);
        if (url.length <= maxChars) return url;
      }
      width = Math.round(width * 0.8);
    }
    throw new Error('image too large');
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

/** Files a profile picture or cover may be made from. */
export const PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Largest file accepted before compression (phone photos are often 3–8 MB). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Limits that match firestore.rules (profiles: avatar 60 000, cover 200 000 characters). */
export const AVATAR_LIMITS: CompressOptions = { maxWidth: 320, maxChars: 58_000, square: true };
export const COVER_LIMITS: CompressOptions = { maxWidth: 1400, maxChars: 195_000 };

/** The first problem with a chosen file, or null when it can be compressed. */
export function imageFileProblem(file: Pick<File, 'type' | 'size'>): string | null {
  if (!PROFILE_IMAGE_TYPES.includes(file.type)) return 'Use a JPEG, PNG or WebP picture.';
  if (file.size > MAX_UPLOAD_BYTES) return 'That picture is over 10 MB. Pick a smaller one.';
  if (file.size === 0) return 'That file is empty.';
  return null;
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

/** fetch() that gives up after `ms`, so one slow picture service can't freeze the picker. */
async function fetchJson(url: string, ms = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const PER_PAGE = 9;
const OPENVERSE_LICENCES: Record<string, string> = { by: 'CC BY', cc0: 'CC0', pdm: 'public domain' };

/**
 * Free pictures from Openverse (openverse.org). Only public domain, CC0 and CC BY, so any use is
 * allowed as long as the CC BY credit travels with the picture.
 */
async function searchOpenverse(query: string, page: number): Promise<PhotoChoice[]> {
  const data = await fetchJson(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license=by,cc0,pdm&aspect_ratio=wide&mature=false&page_size=${PER_PAGE}&page=${page}`,
  );
  return ((data.results ?? []) as { thumbnail: string; creator?: string; license: string }[]).map((r) => ({
    thumb: r.thumbnail,
    src: r.thumbnail,
    copy: true,
    credit: r.license === 'by' ? `Photo: ${r.creator?.trim() || 'unknown'}, ${OPENVERSE_LICENCES.by}` : undefined,
  }));
}

const stripTags = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** Free pictures from Wikimedia Commons, keeping only licences that allow any use with credit. */
async function searchWikimedia(query: string, page: number): Promise<PhotoChoice[]> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: String(PER_PAGE),
    gsroffset: String((page - 1) * PER_PAGE),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiextmetadatafilter: 'Artist|LicenseShortName',
    iiurlwidth: '500',
    format: 'json',
    origin: '*',
  });
  const data = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  const pages = Object.values(data.query?.pages ?? {}) as { index?: number; imageinfo?: any[] }[];
  return pages
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((p) => p.imageinfo?.[0])
    .filter((info) => info?.thumburl)
    .flatMap((info) => {
      const licence: string = info.extmetadata?.LicenseShortName?.value ?? '';
      if (!/^(CC0|Public domain|CC BY(-SA)? [\d.]+)$/i.test(licence)) return [];
      const artist = stripTags(info.extmetadata?.Artist?.value ?? '').slice(0, 60) || 'unknown';
      const needsCredit = /^CC BY/i.test(licence);
      return [{ thumb: info.thumburl, src: info.thumburl, copy: true, credit: needsCredit ? `Photo: ${artist}, ${licence}` : undefined }];
    });
}

/** Both free sources, as separate promises, so the picker can show whichever answers first. */
export function freePhotoSources(query: string, page = 1): Promise<PhotoChoice[]>[] {
  const q = query.trim();
  if (q.length < 3) return [];
  return [searchWikimedia(q, page), searchOpenverse(q, page)];
}
