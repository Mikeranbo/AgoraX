import React, { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { AVATAR_LIMITS, COVER_LIMITS, PROFILE_IMAGE_TYPES, compressToDataUrl, imageFileProblem } from '../data/images';
import { errorClass, labelClass } from './ui';

const buttonClass =
  'inline-flex min-h-11 items-center gap-2 rounded-sheet border border-sheet-line bg-brand-dark px-3 text-[15px] font-semibold text-white hover:border-slate-500 disabled:opacity-60';

/**
 * Upload, preview, reposition (cover), replace and remove a profile picture or cover. Pictures
 * are checked (JPEG/PNG/WebP, ≤10 MB), shrunk on this device to the sizes the rules allow, and
 * only saved with the profile. Links are not accepted, so a profile never loads third-party images.
 */
export const ProfileImageField = ({ kind, value, onChange, position, onPosition, disabled }: {
  kind: 'avatar' | 'cover';
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  /** Cover only: vertical focus, 0–100. */
  position?: number;
  onPosition?: (y: number) => void;
  disabled?: boolean;
}) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const label = kind === 'avatar' ? 'Profile picture' : 'Cover picture';
  const id = `pi-${kind}`;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const problem = imageFileProblem(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setBusy(true);
    try {
      onChange(await compressToDataUrl(file, false, kind === 'avatar' ? AVATAR_LIMITS : COVER_LIMITS));
    } catch (err) {
      console.error(err);
      setError("Couldn't use that picture. Try another one.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div>
      <p className={labelClass} id={`${id}-label`}>{label}</p>
      <div className={`flex gap-3 ${kind === 'cover' ? 'flex-col' : 'items-center'}`}>
        <div
          className={`overflow-hidden bg-brand-dark ${kind === 'avatar' ? 'size-20 shrink-0 rounded-full' : 'h-28 w-full rounded-sheet'} border border-sheet-line`}
          aria-hidden="true"
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" style={kind === 'cover' ? { objectPosition: `50% ${position ?? 50}%` } : undefined} />
          ) : (
            <div className="grid h-full w-full place-items-center text-[13px] text-slate-500">No picture</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            id={id}
            type="file"
            accept={PROFILE_IMAGE_TYPES.join(',')}
            className="sr-only"
            disabled={disabled || busy}
            onChange={(e) => void pick(e.target.files?.[0])}
            aria-labelledby={`${id}-label`}
          />
          <button type="button" onClick={() => input.current?.click()} disabled={disabled || busy} className={buttonClass}>
            <ImagePlus size={16} aria-hidden="true" /> {busy ? 'Preparing…' : value ? 'Replace' : 'Upload'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange(undefined)} disabled={disabled || busy} className={buttonClass}>
              <Trash2 size={16} aria-hidden="true" /> Remove
            </button>
          )}
        </div>
      </div>
      {kind === 'cover' && value && onPosition && (
        <div className="mt-3">
          <label htmlFor={`${id}-pos`} className="text-[13px] text-slate-300">Move the picture up or down</label>
          <input
            id={`${id}-pos`}
            type="range"
            min={0}
            max={100}
            value={position ?? 50}
            onChange={(e) => onPosition(Number(e.target.value))}
            className="mt-1 w-full accent-brand-action"
          />
        </div>
      )}
      <p className="mt-1.5 text-[12px] text-slate-400">JPEG, PNG or WebP, up to 10 MB. It's shrunk on your device before it's saved.</p>
      {error && <p role="alert" className={`${errorClass} mt-1`}>{error}</p>}
    </div>
  );
};
