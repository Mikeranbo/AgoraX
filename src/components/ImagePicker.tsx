import React, { useEffect, useRef, useState } from 'react';
import { Check, ImagePlus, Link2, X } from 'lucide-react';
import { PhotoChoice, checkImageLink, compressToDataUrl, photosForCategory, searchOpenverse } from '../data/images';
import { errorClass, fieldClass, labelClass } from './ui';

export interface PickedImage {
  image: string;
  credit?: string;
}

const optionClass =
  'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sheet border border-sheet-line bg-brand-dark px-3 text-[15px] font-semibold text-white hover:border-slate-500';

/**
 * A photo for a proposed event: upload one, paste a link, or tap one of the ideas, which follow
 * what is typed in "What is it?" and the chosen category.
 */
export const ImagePicker = ({ value, onChange, title, category }: {
  value: PickedImage | null;
  onChange: (v: PickedImage | null) => void;
  title: string;
  category: string;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ideas, setIdeas] = useState<PhotoChoice[]>([]);
  const [page, setPage] = useState(1);
  const [pickedThumb, setPickedThumb] = useState('');
  const [ideasState, setIdeasState] = useState<'idle' | 'loading' | 'error'>('idle');
  const query = title.trim().length >= 3 ? title.trim() : category;

  // Ideas follow the title (after a pause in typing) and the category.
  useEffect(() => {
    let cancelled = false;
    const own = category ? photosForCategory(category).slice(0, 3) : [];
    setIdeas(own);
    setPage(1);
    if (!query) return;
    setIdeasState('loading');
    const timer = setTimeout(() => {
      searchOpenverse(query, 1)
        .then((found) => !cancelled && (setIdeas([...own, ...found]), setIdeasState('idle')))
        .catch(() => !cancelled && setIdeasState('error'));
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, category]);

  const more = async () => {
    setIdeasState('loading');
    try {
      const found = await searchOpenverse(query, page + 1);
      setIdeas((prev) => [...prev, ...found]);
      setPage(page + 1);
      setIdeasState('idle');
    } catch {
      setIdeasState('error');
    }
  };

  const run = async (job: () => Promise<PickedImage>, failure: string) => {
    setBusy(true);
    setError('');
    try {
      onChange(await job());
    } catch (err) {
      console.warn(err);
      setError(failure);
    } finally {
      setBusy(false);
    }
  };

  const pickIdea = (choice: PhotoChoice) => {
    setPickedThumb(choice.thumb);
    return run(
      async () => ({ image: choice.copy ? await compressToDataUrl(choice.src, true) : choice.src, credit: choice.credit }),
      "That picture didn't load. Try another one.",
    );
  };

  return (
    <div>
      <p className={labelClass}>Photo (optional)</p>
      <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-sheet border border-dashed border-sheet-line bg-brand-dark">
        {value ? (
          <>
            <img src={value.image} alt="Chosen photo" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remove photo"
              className="absolute top-2 right-2 grid size-11 place-items-center rounded-full bg-brand-dark/85 text-white"
            >
              <X size={20} />
            </button>
            {value.credit && <span className="absolute bottom-2 left-2 rounded-full bg-brand-dark/85 px-2.5 py-1 text-[12px] text-white">{value.credit}</span>}
          </>
        ) : (
          <p className="grid h-full place-items-center px-6 text-center text-[14px] text-slate-400">
            {busy ? 'Getting the picture ready…' : 'No photo yet. Events with a photo get picked more.'}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} className={optionClass}>
          <ImagePlus size={18} aria-hidden="true" /> Upload
        </button>
        <button type="button" onClick={() => setLinkOpen((o) => !o)} aria-expanded={linkOpen} className={optionClass}>
          <Link2 size={18} aria-hidden="true" /> Paste a link
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Upload a photo"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void run(async () => ({ image: await compressToDataUrl(file) }), "That file isn't a picture we can read.");
        }}
      />

      {linkOpen && (
        <div className="mt-2 flex gap-2">
          <label htmlFor="photo-link" className="sr-only">Link to a picture</label>
          <input
            id="photo-link"
            type="url"
            inputMode="url"
            placeholder="https://…"
            className={fieldClass}
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <button
            type="button"
            onClick={() =>
              void run(async () => {
                await checkImageLink(link);
                setLinkOpen(false);
                return { image: link.trim() };
              }, 'That link is not a picture we can show. It must start with https://.')
            }
            className="min-h-11 shrink-0 rounded-sheet border border-brand-primary px-4 text-[15px] font-bold text-white hover:bg-brand-action/20"
          >
            Use
          </button>
        </div>
      )}

      {error && <p role="alert" className={`mt-2 ${errorClass}`}>{error}</p>}

      {(ideas.length > 0 || ideasState === 'loading') && (
        <div className="mt-4">
          <p className="mb-2 text-[14px] text-slate-300">{query ? `Ideas for "${query}"` : 'Ideas'}</p>
          <div className="grid grid-cols-3 gap-2">
            {ideas.map((choice) => {
              const chosen = !!value && pickedThumb === choice.thumb;
              return (
                <button
                  key={choice.thumb}
                  type="button"
                  onClick={() => void pickIdea(choice)}
                  disabled={busy}
                  aria-label={choice.credit ? `Use this photo (${choice.credit})` : 'Use this photo'}
                  className={`relative aspect-[4/3] overflow-hidden rounded-sheet border-2 ${chosen ? 'border-brand-secondary' : 'border-transparent'}`}
                >
                  <img src={choice.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
                  {chosen && (
                    <span className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-brand-secondary text-brand-dark">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-[13px] text-slate-400">
            <span>
              {ideasState === 'loading' ? 'Looking for pictures…' : ideasState === 'error' ? "Couldn't load more ideas right now." : 'Free pictures from Openverse.'}
            </span>
            {query && ideasState !== 'loading' && (
              <button type="button" onClick={() => void more()} className="min-h-11 font-semibold text-brand-secondary underline underline-offset-4">
                More ideas
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
