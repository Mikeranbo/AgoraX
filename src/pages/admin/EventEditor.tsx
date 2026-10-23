import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Event, EventCategory, EventStatus, PUBLIC_CATEGORIES, LEGACY_CATEGORIES } from '../../types';
import { EventFormData, saveEvent } from '../../services/adminService';
import { ImagePicker, PickedImage } from '../../components/ImagePicker';

const DAY = 24 * 60 * 60 * 1000;

const input =
  'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary';
const label = 'block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1';

/** ISO string <-> the "YYYY-MM-DDTHH:mm" value a datetime-local input wants. */
function toLocalInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string, fallbackDays: number): string {
  const d = value ? new Date(value) : new Date(Date.now() + fallbackDays * DAY);
  return (Number.isNaN(d.getTime()) ? new Date(Date.now() + fallbackDays * DAY) : d).toISOString();
}

interface FormState {
  title: string;
  description: string;
  category: EventCategory;
  price: string;
  minParticipants: string;
  status: EventStatus;
  deadline: string;
  startTime: string;
  photo: PickedImage | null;
  emoji: string;
  accent: string;
  durationHours: string;
  hostsNeeded: string;
  fixedCost: string;
  perPersonCost: string;
  bringYourOwn: string;
  venueNote: string;
  season: 'any' | 'spring';
}

function initial(event: Event | null): FormState {
  return {
    title: event?.title ?? '',
    description: event?.description ?? '',
    category: event?.category ?? 'Social',
    price: String(event?.price ?? 0),
    minParticipants: String(event?.minParticipants ?? 10),
    status: event?.status ?? 'Pending',
    deadline: toLocalInput(event?.deadline ?? new Date(Date.now() + 21 * DAY).toISOString()),
    startTime: toLocalInput(event?.startTime ?? new Date(Date.now() + 28 * DAY).toISOString()),
    photo: event?.imageUrls?.[0] ? { image: event.imageUrls[0], credit: event.imageCredit } : null,
    emoji: event?.emoji ?? '💡',
    accent: event?.accent ?? '#818cf8',
    durationHours: String(event?.durationHours ?? 2),
    hostsNeeded: String(event?.hostsNeeded ?? 1),
    fixedCost: String(event?.fixedCost ?? 0),
    perPersonCost: String(event?.perPersonCost ?? 0),
    bringYourOwn: event?.bringYourOwn ?? '',
    venueNote: event?.venueNote ?? '',
    season: event?.season ?? 'any',
  };
}

const toNumber = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

interface EventEditorProps {
  /** null = creating a new event. */
  event: Event | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

/** Every editable field on one screen: price, minimum, deadline, category, copy, emoji, accent, costs. */
export const EventEditor = ({ event, onClose, onSaved }: EventEditorProps) => {
  const [f, setF] = useState<FormState>(() => initial(event));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setF((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const minParticipants = Math.round(toNumber(f.minParticipants));
    if (!f.title.trim()) return setError('Title is required.');
    if (minParticipants < 1) return setError('Minimum participants must be at least 1.');
    if (toNumber(f.price) < 0) return setError('Price cannot be negative.');

    const data: EventFormData = {
      title: f.title.trim(),
      description: f.description.trim(),
      category: f.category,
      price: toNumber(f.price),
      minParticipants,
      status: f.status,
      deadline: fromLocalInput(f.deadline, 21),
      startTime: fromLocalInput(f.startTime, 28),
      imageUrls: f.photo ? [f.photo.image] : [],
      imageCredit: f.photo?.credit ?? '',
      emoji: f.emoji.trim() || '💡',
      accent: f.accent,
      durationHours: toNumber(f.durationHours),
      hostsNeeded: Math.max(1, Math.round(toNumber(f.hostsNeeded))),
      fixedCost: Math.max(0, toNumber(f.fixedCost)),
      perPersonCost: Math.max(0, toNumber(f.perPersonCost)),
      bringYourOwn: f.bringYourOwn.trim(),
      venueNote: f.venueNote.trim(),
      season: f.season,
    };

    setBusy(true);
    try {
      await saveEvent(event?.id ?? null, data);
      onSaved(event ? `Saved “${data.title}”.` : `Created “${data.title}”.`);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message?.includes('permission') ? 'Permission denied — your role cannot edit events.' : `Could not save: ${err?.message ?? err}`);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="bg-[#111a2e] border border-white/10 rounded-2xl w-full max-w-3xl my-8 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-black text-white">{event ? `Edit — ${event.title}` : 'New event'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Title</label>
            <input className={input} value={f.title} maxLength={200} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Description</label>
            <textarea className={`${input} min-h-[90px]`} value={f.description} maxLength={2000} onChange={(e) => set('description', e.target.value)} />
          </div>

          <div>
            <label className={label}>Category</label>
            <select className={input} value={f.category} onChange={(e) => set('category', e.target.value as EventCategory)}>
              {[...PUBLIC_CATEGORIES, ...LEGACY_CATEGORIES].map((c) => (
                <option key={c} value={c} className="bg-[#0f172a]">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Status</label>
            <select className={input} value={f.status} onChange={(e) => set('status', e.target.value as EventStatus)}>
              {(['Pending', 'Confirmed', 'Cancelled'] as EventStatus[]).map((s) => (
                <option key={s} value={s} className="bg-[#0f172a]">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={label}>Price (€, 0 = free)</label>
            <input className={input} type="number" min={0} step="0.5" value={f.price} onChange={(e) => set('price', e.target.value)} />
          </div>
          <div>
            <label className={label}>Minimum participants</label>
            <input className={input} type="number" min={1} value={f.minParticipants} onChange={(e) => set('minParticipants', e.target.value)} />
          </div>

          <div>
            <label className={label}>Deadline</label>
            <input className={input} type="datetime-local" value={f.deadline} onChange={(e) => set('deadline', e.target.value)} />
          </div>
          <div>
            <label className={label}>Start time</label>
            <input className={input} type="datetime-local" value={f.startTime} onChange={(e) => set('startTime', e.target.value)} />
          </div>

          <div>
            <label className={label}>Emoji</label>
            <input className={input} value={f.emoji} maxLength={8} onChange={(e) => set('emoji', e.target.value)} />
          </div>
          <div>
            <label className={label}>Accent colour</label>
            <div className="flex gap-2">
              <input type="color" value={f.accent} onChange={(e) => set('accent', e.target.value)} className="h-9 w-12 rounded bg-transparent border border-white/10" />
              <input className={input} value={f.accent} maxLength={9} onChange={(e) => set('accent', e.target.value)} />
            </div>
          </div>

          <div>
            <label className={label}>Duration (hours)</label>
            <input className={input} type="number" min={0} step="0.5" value={f.durationHours} onChange={(e) => set('durationHours', e.target.value)} />
          </div>
          <div>
            <label className={label}>Hosts needed</label>
            <input className={input} type="number" min={1} value={f.hostsNeeded} onChange={(e) => set('hostsNeeded', e.target.value)} />
          </div>

          <div>
            <label className={label}>Fixed cost (€)</label>
            <input className={input} type="number" min={0} step="0.5" value={f.fixedCost} onChange={(e) => set('fixedCost', e.target.value)} />
          </div>
          <div>
            <label className={label}>Per-person cost (€)</label>
            <input className={input} type="number" min={0} step="0.5" value={f.perPersonCost} onChange={(e) => set('perPersonCost', e.target.value)} />
          </div>

          <div>
            <label className={label}>Season</label>
            <select className={input} value={f.season} onChange={(e) => set('season', e.target.value as 'any' | 'spring')}>
              <option value="any" className="bg-[#0f172a]">Any — runnable now</option>
              <option value="spring" className="bg-[#0f172a]">Spring trip</option>
            </select>
          </div>
          <div>
            <label className={label}>Where / venue note</label>
            <input className={input} value={f.venueNote} onChange={(e) => set('venueNote', e.target.value)} />
          </div>

          <div className="sm:col-span-2">
            <label className={label}>Not included (bring your own)</label>
            <input className={input} value={f.bringYourOwn} onChange={(e) => set('bringYourOwn', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <ImagePicker value={f.photo} onChange={(v) => set('photo', v)} title={f.title} category={f.category} />
            <p className="mt-1 text-[11px] text-slate-500">No photo: seed events use their default photo, others the emoji cover.</p>
          </div>
        </div>

        {error && <p role="alert" className="mt-4 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="px-5 py-2 rounded-lg gradient-brand text-white text-sm font-black disabled:opacity-60">
            {busy ? 'Saving…' : event ? 'Save changes' : 'Create event'}
          </button>
        </div>
      </form>
    </div>
  );
};
