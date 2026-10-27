import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Film, ImagePlus, Link2, Star, Trash2, Video } from 'lucide-react';
import type { EventMedia } from '../types';
import { MAX_MEDIA, parseVideoLink, youtubeThumb } from '../data/media';
import { videoFileProblem, uploadEventVideo } from '../services/mediaService';
import { ImagePicker, PickedImage } from './ImagePicker';
import { errorClass, fieldClass } from './ui';

const KIND_LABEL: Record<EventMedia['kind'], string> = { image: 'Photo', video: 'Video loop', youtube: 'YouTube', vimeo: 'Vimeo' };
const smallButton =
  'grid size-9 place-items-center rounded-lg border border-sheet-line text-slate-200 hover:border-slate-500 hover:text-white disabled:opacity-30';
const addButton =
  'inline-flex min-h-10 items-center gap-2 rounded-lg border border-sheet-line px-3 text-[14px] font-semibold text-white hover:border-slate-500 disabled:opacity-50';

/** Stored data URLs add up; Firestore documents stop at 1 MB, so we warn well before that. */
const SIZE_WARNING = 800_000;

const Thumb = ({ item }: { item: EventMedia }) => {
  const still = item.kind === 'image' ? item.src : item.kind === 'youtube' ? youtubeThumb(item.src) : item.poster;
  return (
    <span className="relative grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-dark">
      {still ? <img src={still} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <Film size={20} className="text-slate-400" aria-hidden="true" />}
      {item.kind !== 'image' && (
        <span className="absolute right-1 bottom-1 rounded bg-black/60 px-1 text-[10px] font-bold text-white">{KIND_LABEL[item.kind]}</span>
      )}
    </span>
  );
};

/**
 * An event's gallery, in order: the first item is the cover. Add photos (upload, a link or a free
 * photo), videos (upload to Storage, or a YouTube/Vimeo link), reorder, remove, set the cover.
 * Controlled: the admin editor and the organiser sheet each decide when to save.
 */
export const MediaEditor = ({ value, onChange, eventId, title, category }: {
  value: EventMedia[];
  onChange: (next: EventMedia[]) => void;
  /** Needed to upload videos; a brand-new event has to be saved first. */
  eventId?: string;
  title: string;
  category: string;
}) => {
  const videoRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState<'photo' | 'link' | null>(null);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const full = value.length >= MAX_MEDIA;
  const size = JSON.stringify(value).length;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const update = (i: number, patch: Partial<EventMedia>) => onChange(value.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const add = (item: EventMedia) => {
    setError('');
    onChange([...value, item]);
  };

  const addPhoto = (picked: PickedImage | null) => {
    if (!picked) return;
    add({ kind: 'image', src: picked.image, ...(picked.credit ? { credit: picked.credit } : {}) });
    setAdding(null);
  };

  const addLink = () => {
    const parsed = parseVideoLink(link);
    if (!parsed) return setError('Paste a YouTube or Vimeo link, like https://youtu.be/… or https://vimeo.com/….');
    add(parsed);
    setLink('');
    setAdding(null);
  };

  const uploadVideo = async (file: File) => {
    const problem = videoFileProblem(file);
    if (problem) return setError(problem);
    if (!eventId) return setError('Save the event first, then upload videos to it.');
    setError('');
    setProgress(0);
    try {
      const url = await uploadEventVideo(eventId, file, setProgress);
      add({ kind: 'video', src: url });
    } catch (e) {
      const code = String((e as { code?: string })?.code ?? '');
      setError(
        code.includes('unauthorized')
          ? "You can't upload videos to this event."
          : 'The upload failed. Video uploads need Firebase Storage, which may not be switched on yet. A YouTube or Vimeo link works in the meantime.',
      );
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="text-[14px] text-slate-300">No photos or videos yet. The event shows its emoji until you add one.</p>
      ) : (
        <ol className="space-y-2">
          {value.map((item, i) => (
            <li key={`${i}-${item.src.slice(-40)}`} className="flex flex-wrap items-center gap-3 rounded-xl border border-sheet-line bg-brand-dark/60 p-2">
              <Thumb item={item} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[14px] font-semibold text-white">
                  {KIND_LABEL[item.kind]}
                  {i === 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-action/30 px-2 text-[11px] font-bold text-white">
                      <Star size={11} aria-hidden="true" /> Cover
                    </span>
                  )}
                </p>
                <label className="sr-only" htmlFor={`credit-${i}`}>Credit for item {i + 1}</label>
                <input
                  id={`credit-${i}`}
                  value={item.credit ?? ''}
                  onChange={(e) => update(i, { credit: e.target.value.slice(0, 120) || undefined })}
                  placeholder="Credit, e.g. Photo: Jane Doe / Unsplash"
                  className="mt-1 w-full min-w-0 rounded-md border border-sheet-line bg-transparent px-2 py-1 text-[13px] text-slate-200 placeholder:text-slate-500 focus:border-brand-secondary focus:outline-none"
                />
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, 0)} disabled={i === 0} aria-label={`Make item ${i + 1} the cover`} title="Make it the cover" className={smallButton}>
                  <Star size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move item ${i + 1} up`} className={smallButton}>
                  <ArrowUp size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} aria-label={`Move item ${i + 1} down`} className={smallButton}>
                  <ArrowDown size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove item ${i + 1}`} className={`${smallButton} hover:text-red-300`}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setAdding(adding === 'photo' ? null : 'photo')} disabled={full} className={addButton}>
          <ImagePlus size={16} aria-hidden="true" /> Add a photo
        </button>
        <button type="button" onClick={() => videoRef.current?.click()} disabled={full || progress !== null} className={addButton}>
          <Video size={16} aria-hidden="true" /> {progress !== null ? `Uploading… ${Math.round(progress * 100)}%` : 'Upload a video'}
        </button>
        <button type="button" onClick={() => setAdding(adding === 'link' ? null : 'link')} disabled={full} className={addButton}>
          <Link2 size={16} aria-hidden="true" /> YouTube or Vimeo link
        </button>
        <input
          ref={videoRef}
          type="file"
          accept="video/mp4,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void uploadVideo(file);
          }}
        />
      </div>

      {adding === 'photo' && <ImagePicker value={null} onChange={addPhoto} title={title} category={category} />}
      {adding === 'link' && (
        <div className="flex gap-2">
          <label htmlFor="media-link" className="sr-only">YouTube or Vimeo link</label>
          <input id="media-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://youtu.be/…" className={fieldClass} />
          <button type="button" onClick={addLink} className={addButton}>Add</button>
        </div>
      )}

      <p className="text-[12px] text-slate-400">
        Up to {MAX_MEDIA} items. Videos: mp4 or webm, at most 50 MB; they play as silent loops. Credit every photo or video that isn't
        yours.
      </p>
      {full && <p className="text-[13px] text-slate-300">That's the maximum. Remove something to add more.</p>}
      {size > SIZE_WARNING && <p className={errorClass}>Uploaded photos are taking a lot of space. Use fewer, or free photos and links instead.</p>}
      {error && <p role="alert" className={errorClass}>{error}</p>}
    </div>
  );
};
