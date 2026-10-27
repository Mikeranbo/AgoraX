/**
 * An event's gallery, ready to show. The event's own media list wins; otherwise a seed event
 * shows the photos and loop that scripts/build-media.mjs made for it; otherwise its own photos
 * (imageUrls, from older documents and proposals). The first item is always the cover.
 */
import type { Event, EventMedia } from '../types';
import { MEDIA_MANIFEST, SeedMedia } from './mediaManifest';

export interface MediaItem {
  kind: EventMedia['kind'];
  /** Image: the fallback URL. Video: the file. YouTube/Vimeo: the video id. */
  src: string;
  /** Image only: a WebP srcset when the file is one of ours. */
  srcSet?: string;
  /** Video: a still. YouTube: its thumbnail. */
  poster?: string;
  posterSrcSet?: string;
  width?: number;
  height?: number;
  credit?: string;
  link?: string;
}

const srcset = (base: string, widths: number[]) => widths.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
const middle = (widths: number[]) => widths.find((w) => w >= 1280) ?? widths[widths.length - 1];

function fromSeed(m: SeedMedia): MediaItem {
  if (m.kind === 'image') {
    return { kind: 'image', src: `${m.base}-${middle(m.widths)}.webp`, srcSet: srcset(m.base, m.widths), width: m.width, height: m.height, credit: m.credit, link: m.link };
  }
  return {
    kind: 'video',
    src: m.src,
    poster: `${m.poster}-${middle(m.posterWidths)}.webp`,
    posterSrcSet: srcset(m.poster, m.posterWidths),
    width: m.width,
    height: m.height,
    credit: m.credit,
    link: m.link,
  };
}

/** One of our own files (/media/<slug>/<n>-<w>.webp)? Then serve every width again. */
function ownFile(url: string) {
  const match = url.match(/^(\/media\/[^/]+\/(?:\d+|video-poster))-\d+\.webp$/);
  if (!match) return undefined;
  for (const items of Object.values(MEDIA_MANIFEST)) {
    for (const m of items) {
      if (m.kind === 'image' && m.base === match[1]) return srcset(m.base, m.widths);
      if (m.kind === 'video' && m.poster === match[1]) return srcset(m.poster, m.posterWidths);
    }
  }
  return undefined;
}

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

function fromStored(m: EventMedia): MediaItem {
  if (m.kind === 'image') return { kind: 'image', src: m.src, srcSet: ownFile(m.src), credit: m.credit, link: m.link };
  if (m.kind === 'video') return { kind: 'video', src: m.src, poster: m.poster, posterSrcSet: m.poster ? ownFile(m.poster) : undefined, credit: m.credit, link: m.link };
  if (m.kind === 'youtube') return { kind: 'youtube', src: m.src, poster: youtubeThumb(m.src), credit: m.credit, link: m.link };
  return { kind: 'vimeo', src: m.src, credit: m.credit, link: m.link };
}

/** The seed media for a slug, in the stored shape, so an editor can start from it. */
export function seedMedia(slug?: string): EventMedia[] {
  return (slug ? MEDIA_MANIFEST[slug] ?? [] : []).map((m) =>
    m.kind === 'image'
      ? { kind: 'image', src: `${m.base}-${middle(m.widths)}.webp`, credit: m.credit, link: m.link }
      : { kind: 'video', src: m.src, poster: `${m.poster}-${middle(m.posterWidths)}.webp`, credit: m.credit, link: m.link },
  );
}

/** The media list an editor starts from: the stored one, or what the event shows today. */
export function editableMedia(e: Pick<Event, 'media' | 'slug' | 'imageUrls' | 'imageCredit'>): EventMedia[] {
  if (e.media && e.media.length > 0) return e.media;
  const seed = seedMedia(e.slug);
  if (seed.length > 0) return seed;
  return (e.imageUrls ?? []).filter((u) => u && u.trim() !== '').map((src, i) => ({ kind: 'image', src, credit: i === 0 ? e.imageCredit : undefined }));
}

/** The gallery to show, cover first. Empty means: show the event's emoji on its colour. */
export function mediaFor(e: Pick<Event, 'media' | 'slug' | 'imageUrls' | 'imageCredit'>): MediaItem[] {
  if (e.media && e.media.length > 0) return e.media.map(fromStored);
  const seed = e.slug ? MEDIA_MANIFEST[e.slug] : undefined;
  if (seed && seed.length > 0) return seed.map(fromSeed);
  return editableMedia(e).map(fromStored);
}

/** A YouTube or Vimeo link, as the kind and id we store; undefined for anything else. */
export function parseVideoLink(raw: string): Pick<EventMedia, 'kind' | 'src'> | undefined {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return undefined;
  }
  const host = url.hostname.replace(/^www\.|^m\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0];
    return /^[\w-]{11}$/.test(id) ? { kind: 'youtube', src: id } : undefined;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const id = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1] ?? '';
    return /^[\w-]{11}$/.test(id) ? { kind: 'youtube', src: id } : undefined;
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.match(/(\d{6,12})/)?.[1];
    return id ? { kind: 'vimeo', src: id } : undefined;
  }
  return undefined;
}

/** The embed URL for a YouTube or Vimeo item: privacy-enhanced, starting on tap. */
export function embedUrl(item: Pick<MediaItem, 'kind' | 'src'>): string {
  return item.kind === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${item.src}?autoplay=1&rel=0&playsinline=1`
    : `https://player.vimeo.com/video/${item.src}?autoplay=1&dnt=1`;
}

/** Most an event's gallery may hold (Firestore rules allow the same). */
export const MAX_MEDIA = 12;
