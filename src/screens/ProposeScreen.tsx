import React, { useState } from 'react';
import { ArrowLeft, CalendarClock, Eye } from 'lucide-react';
import { Event, EventCategory, PUBLIC_CATEGORIES, Proposal } from '../types';
import { ProposalFormValues, validateProposal } from '../data/proposals';
import { CONSENT_TEXTS } from '../data/consent';
import { submitProposal } from '../services/firebaseService';
import { writeProposal } from '../services/organiserService';
import { track } from '../services/analytics';
import { useVisitor } from '../state/VisitorProvider';
import { errorClass, fieldClass, labelClass, primaryButtonClass } from '../components/ui';
import { ImagePicker, PickedImage } from '../components/ImagePicker';
import { PhotoBackdrop } from '../components/EventCard';
import { CollectionNotice } from '../components/CollectionNotice';

const EMPTY: ProposalFormValues = {
  title: '',
  category: '',
  price: '',
  minPeople: '',
  firstName: '',
  phone: '',
  email: '',
  needs: '',
  consent: false,
};

const fromDraft = (p: Proposal | null): ProposalFormValues =>
  p ? { ...EMPTY, title: p.title, category: p.category, price: String(p.price), minPeople: String(p.minPeople), needs: p.needs } : EMPTY;

/** What the card will look like, without any of the live card's buttons or counting. */
const ProposalPreview = ({ v, photo }: { v: ProposalFormValues; photo: PickedImage | null }) => {
  const event = {
    id: 'preview',
    title: v.title.trim() || 'Your event',
    description: v.needs,
    category: (v.category || 'Social') as EventCategory,
    price: Number(v.price) || 0,
    minParticipants: Number(v.minPeople) || 0,
    participantsCount: 0,
    status: 'Pending',
    organizerId: '',
    imageUrls: photo ? [photo.image] : [],
    emoji: '💡',
  } as Event;
  return (
    <section aria-label="Preview" className="rounded-[18px] bg-[#12163a]/80">
      <PhotoBackdrop event={event} className="aspect-[2/1] rounded-[18px] ring-1 ring-white/10">
        <span className="absolute top-4 left-2.5 flex gap-1.5">
          <span className="rounded-full border border-white/30 bg-[#0f172a]/80 px-2.5 py-0.5 text-[12px] leading-5 font-semibold text-white">Proposal</span>
          <span className="rounded-full bg-[#0f172a]/80 px-2.5 py-0.5 text-[12px] leading-5 font-semibold text-white">{event.category}</span>
        </span>
        <span className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#0f172a]/80 px-2.5 py-0.5 text-[12px] leading-5 font-semibold text-white">
          <CalendarClock size={13} aria-hidden="true" /> Date to be confirmed
        </span>
      </PhotoBackdrop>
      <div className="space-y-2.5 px-3 pt-2.5 pb-3">
        <p className="font-display text-[19px] leading-[1.15] font-bold text-white">{event.title}</p>
        <div>
          <p className="mb-1.5 text-[13px] text-slate-300 tabular-nums">
            <span className="font-semibold text-white">0 of {event.minParticipants || '?'}</span> needed to run
          </p>
          <div className="h-[5px] rounded-full bg-white/10" aria-hidden="true" />
        </div>
        <p className="font-display text-[24px] font-extrabold text-white">
          {event.price === 0 ? 'Free' : `€${event.price}`} <span className="font-sans text-[11px] font-normal text-slate-400">indicative price</span>
        </p>
        <p className="text-[12px] text-slate-400">Preview only. Proposals go live after we've checked them.</p>
      </div>
    </section>
  );
};

/** A one-minute form. Organisers can keep it as a draft; it shows in the list only once approved. */
export const ProposeScreen = () => {
  const { state, actions, meta } = useVisitor();
  const draft = state.editing;
  const [v, setV] = useState<ProposalFormValues>(() => fromDraft(draft));
  const [photo, setPhoto] = useState<PickedImage | null>(() => (draft?.image ? { image: draft.image, credit: draft.imageCredit } : null));
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'idle' | 'busy' | 'done'>('idle');
  const [preview, setPreview] = useState(false);
  const set = <K extends keyof ProposalFormValues>(key: K, value: ProposalFormValues[K]) => setV((prev) => ({ ...prev, [key]: value }));
  // Only a public organiser profile is named on the proposal, never the uid.
  const organiserPublicId = state.profile?.organiser?.enabled ? state.me?.publicId : undefined;

  const asDraft = () => ({
    title: v.title.trim(),
    category: v.category as EventCategory,
    price: Number(v.price),
    minPeople: Number(v.minPeople),
    needs: v.needs.trim(),
    image: photo?.image,
    imageCredit: photo?.credit,
  });

  const saveDraft = async () => {
    if (phase === 'busy') return;
    const problem = validateProposal(v, 'draft');
    setError(problem ?? '');
    if (problem) return;
    setPhase('busy');
    try {
      await writeProposal(draft?.id ?? null, asDraft(), 'draft', organiserPublicId);
      actions.showToast('Draft saved. Only you can see it.');
      actions.editProposal(null);
      actions.setTab('proposals');
    } catch (err) {
      console.error(err);
      setError("That didn't save. Check your connection and try again.");
      setPhase('idle');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === 'busy') return;
    const problem = validateProposal(v);
    setError(problem ?? '');
    if (problem || !v.category) return;
    setPhase('busy');
    try {
      await submitProposal({
        ...asDraft(),
        firstName: v.firstName.trim(),
        phone: v.phone.trim(),
        email: v.email.trim(),
        draftId: draft?.id ?? null,
        organiserPublicId,
      });
      track('proposal_submit', { category: v.category });
      setPhase('done');
    } catch (err) {
      console.error(err);
      setError("That didn't send. Check your connection and try again.");
      setPhase('idle');
    }
  };

  const reset = () => {
    setV(EMPTY);
    setPhoto(null);
    setPhase('idle');
    actions.editProposal(null);
  };

  return (
    <div className="mx-auto max-w-xl px-4 pt-16 sm:px-6">
      <button onClick={() => actions.setTab(draft ? 'proposals' : 'events')} className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-2 px-2 text-[15px] font-semibold text-slate-200 hover:text-white">
        <ArrowLeft size={18} aria-hidden="true" /> {draft ? 'My proposals' : 'Back to proposals'}
      </button>
      <h1 className="font-display leading-[0.95] font-extrabold tracking-[-0.025em] text-white" style={{ fontSize: 'clamp(36px, 8vw, 56px)' }}>
        {draft ? 'Edit draft' : 'Propose an event'}
      </h1>

      {phase === 'done' ? (
        <div className="sheet mt-5 space-y-4 rounded-sheet p-5" role="status">
          <p className="text-[16px] leading-relaxed text-slate-200">
            Got it. We'll look at "{v.title.trim()}" and get in touch. It goes into the list as a proposal once we've checked it, and that
            still doesn't mean it will run.
          </p>
          <button
            onClick={() => {
              reset();
              actions.setTab('proposals');
            }}
            className={primaryButtonClass}
          >
            See my proposals
          </button>
        </div>
      ) : (
        <>
          <p className="mt-2 mb-5 text-[16px] text-slate-300">
            Takes a minute. If enough people are interested and we can make it work, it could be one of the events we run.
          </p>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label className={labelClass} htmlFor="p-title">What is it? (required)</label>
              <input id="p-title" required maxLength={120} placeholder="Sunday morning run along the Hoornse Meer" className={fieldClass} value={v.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="p-category">Category (required)</label>
              <select id="p-category" required className={fieldClass} value={v.category} onChange={(e) => set('category', e.target.value as EventCategory | '')}>
                <option value="">Choose…</option>
                {PUBLIC_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="p-price">Rough price (€)</label>
                <input id="p-price" type="number" inputMode="decimal" min={0} max={200} placeholder="5" className={fieldClass} value={v.price} onChange={(e) => set('price', e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="p-min">People it needs</label>
                <input id="p-min" type="number" inputMode="numeric" min={2} max={200} placeholder="10" className={fieldClass} value={v.minPeople} onChange={(e) => set('minPeople', e.target.value)} />
              </div>
            </div>
            <ImagePicker value={photo} onChange={setPhoto} title={v.title} category={v.category} />
            <div>
              <label className={labelClass} htmlFor="p-needs">What would you need to make it happen?</label>
              <textarea id="p-needs" maxLength={500} placeholder="A room for 15, a projector, someone who knows the route…" className={`${fieldClass} min-h-[88px]`} value={v.needs} onChange={(e) => set('needs', e.target.value)} />
            </div>

            <button type="button" onClick={() => setPreview((p) => !p)} aria-expanded={preview} className="inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-brand-secondary underline underline-offset-4">
              <Eye size={16} aria-hidden="true" /> {preview ? 'Hide preview' : 'Preview the card'}
            </button>
            {preview && <ProposalPreview v={v} photo={photo} />}

            <fieldset className="space-y-4 rounded-sheet border border-sheet-line p-4">
              <legend className="px-1 text-[14px] font-semibold text-slate-200">So we can talk to you about it (needed to send)</legend>
              <div>
                <label className={labelClass} htmlFor="p-name">First name</label>
                <input id="p-name" autoComplete="given-name" maxLength={80} className={fieldClass} value={v.firstName} onChange={(e) => set('firstName', e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="p-email">Email</label>
                  <input id="p-email" type="email" autoComplete="email" className={fieldClass} value={v.email} onChange={(e) => set('email', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="p-phone">or WhatsApp</label>
                  <input id="p-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12345678" className={fieldClass} value={v.phone} onChange={(e) => set('phone', e.target.value)} />
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={v.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-brand-action" />
                <span className="text-[14px] leading-relaxed text-slate-300">{CONSENT_TEXTS.proposal}</span>
              </label>
            </fieldset>

            {organiserPublicId && <p className="text-[13px] text-slate-300">Your organiser profile will be shown with it if it goes live.</p>}
            {error && <p role="alert" className={errorClass}>{error}</p>}
            <button type="submit" disabled={phase === 'busy'} className={primaryButtonClass}>
              {phase === 'busy' ? 'Sending…' : 'Send for review'}
            </button>
            {meta.organising && (
              <button
                type="button"
                onClick={() => void saveDraft()}
                disabled={phase === 'busy'}
                className="min-h-12 w-full rounded-sheet border border-brand-primary px-4 font-display text-[17px] font-bold text-white hover:bg-brand-action/20 disabled:opacity-60"
              >
                Save as draft
              </button>
            )}
            <CollectionNotice>Sending keeps your idea, your first name, the email or number you give, and the box you ticked.</CollectionNotice>
          </form>
        </>
      )}
    </div>
  );
};
