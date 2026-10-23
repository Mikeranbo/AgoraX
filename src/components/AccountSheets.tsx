import React, { useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { Modal } from './Modal';
import { useVisitor } from '../state/VisitorProvider';
import { LOCKED_FEATURES, LockedFeature } from '../data/features';
import { PRIVACY_NOTICE_FINAL } from '../config/pilot';
import type { OrganiserIdentity, PublicProfile, UserMode } from '../types';
import { ProfileAvatar } from './Avatar';
import { ProfileImageField } from './ProfileImageField';
import { CollectionNotice } from './CollectionNotice';
import { errorClass, fieldClass, labelClass, primaryButtonClass } from './ui';

/** "Not available yet": one vote button, one way out. */
export const LockedSheet = () => {
  const { state, actions } = useVisitor();
  const last = useRef<LockedFeature | null>(state.lockedFeature);
  if (state.lockedFeature) last.current = state.lockedFeature;
  const feature = state.lockedFeature ?? last.current;

  return (
    <Modal isOpen={state.sheet === 'locked'} onClose={actions.closeSheet} title={feature ? LOCKED_FEATURES[feature] : 'Coming soon'}>
      <p className="mb-6 flex items-center gap-2 text-[16px] text-slate-200">
        <Lock size={18} className="shrink-0 text-slate-400" aria-hidden="true" /> Not available yet. Tell us if you'd use it.
      </p>
      <div className="space-y-2">
        {feature && (
          <button onClick={() => actions.voteFeature(feature)} className={primaryButtonClass}>
            I want this
          </button>
        )}
        <button onClick={actions.closeSheet} className="min-h-11 w-full text-[15px] font-semibold text-slate-300 hover:text-white">
          Close
        </button>
      </div>
    </Modal>
  );
};

/** While the privacy notice is a draft: the private display name only, as before. */
const PrivateNameForm = () => {
  const { state, actions } = useVisitor();
  const [name, setName] = useState(state.me?.displayName ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await actions.saveProfile(name);
    } catch (err) {
      console.error(err);
      setError("That didn't save. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="flex items-center gap-4">
        <ProfileAvatar size={64} />
        <p className="text-[14px] leading-snug text-slate-300">Your name here is private: only you see it, on this device.</p>
      </div>
      <div>
        <label className={labelClass} htmlFor="display-name">Display name</label>
        <input id="display-name" maxLength={40} autoComplete="nickname" className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <p className="rounded-sheet border border-sheet-line p-3 text-[13px] leading-relaxed text-slate-300">
        Profile photos, a bio and an organiser profile open once our privacy notice is final. Until then we don't collect them.
      </p>
      {error && <p role="alert" className={errorClass}>{error}</p>}
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
};

const EMPTY_ORGANISER: OrganiserIdentity = { enabled: true, kind: 'individual', name: '', about: '' };

/** The public profile: what others may see. Private details are never part of it. */
const PublicProfileForm = () => {
  const { state, actions, meta } = useVisitor();
  const start = state.profile;
  const [p, setP] = useState<PublicProfile>(() => ({
    displayName: start?.displayName ?? state.me?.displayName ?? '',
    bio: start?.bio ?? '',
    interests: start?.interests ?? '',
    area: start?.area ?? '',
    avatar: start?.avatar,
    cover: start?.cover,
    coverY: start?.coverY ?? 50,
    organiser: start?.organiser ?? (meta.organising ? EMPTY_ORGANISER : undefined),
  }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof PublicProfile>(key: K, value: PublicProfile[K]) => setP((prev) => ({ ...prev, [key]: value }));
  const setOrg = (next: Partial<OrganiserIdentity>) => setP((prev) => ({ ...prev, organiser: { ...(prev.organiser ?? EMPTY_ORGANISER), ...next } }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!p.displayName.trim()) return setError('Add a display name.');
    if (p.organiser?.enabled && !p.organiser.name.trim()) return setError('Add the name you organise under, or turn the organiser profile off.');
    setError('');
    setBusy(true);
    try {
      await actions.savePublicProfile(p);
      actions.closeSheet();
      actions.showToast('Profile saved.');
    } catch (err) {
      console.error(err);
      setError("That didn't save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <ProfileImageField kind="cover" value={p.cover} onChange={(v) => set('cover', v)} position={p.coverY} onPosition={(y) => set('coverY', y)} />
      <ProfileImageField kind="avatar" value={p.avatar} onChange={(v) => set('avatar', v)} />
      <div>
        <label className={labelClass} htmlFor="pp-name">Display name (required)</label>
        <input id="pp-name" required maxLength={40} autoComplete="nickname" className={fieldClass} value={p.displayName} onChange={(e) => set('displayName', e.target.value)} />
      </div>
      <div>
        <label className={labelClass} htmlFor="pp-bio">Short bio (optional)</label>
        <textarea id="pp-bio" maxLength={280} rows={3} className={fieldClass} value={p.bio} onChange={(e) => set('bio', e.target.value)} />
      </div>
      <div>
        <label className={labelClass} htmlFor="pp-interests">Interests (optional)</label>
        <input id="pp-interests" maxLength={160} placeholder="Board games, climbing, film" className={fieldClass} value={p.interests} onChange={(e) => set('interests', e.target.value)} />
      </div>
      <div>
        <label className={labelClass} htmlFor="pp-area">Area (optional)</label>
        <input id="pp-area" maxLength={60} placeholder="Groningen" className={fieldClass} value={p.area} onChange={(e) => set('area', e.target.value)} />
        <p className="mt-1.5 text-[12px] text-slate-400">A city or region at most. Never an address.</p>
      </div>

      {meta.organising && (
        <fieldset className="space-y-4 rounded-sheet border border-sheet-line p-4">
          <legend className="px-1 font-display text-[17px] font-bold text-white">Organiser profile</legend>
          <label className="flex items-center gap-3 text-[15px] text-slate-200">
            <input type="checkbox" checked={!!p.organiser?.enabled} onChange={(e) => setOrg({ enabled: e.target.checked })} className="size-5 accent-brand-action" />
            Show me as the organiser on proposals I send
          </label>
          {p.organiser?.enabled && (
            <>
              <div className="flex gap-2" role="radiogroup" aria-label="I organise as">
                {(['individual', 'organisation'] as const).map((k) => (
                  <label key={k} className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-sheet border text-[15px] font-semibold ${p.organiser?.kind === k ? 'border-brand-primary bg-brand-action/20 text-white' : 'border-sheet-line text-slate-300'}`}>
                    <input type="radio" name="org-kind" checked={p.organiser?.kind === k} onChange={() => setOrg({ kind: k })} className="sr-only" />
                    {k === 'individual' ? 'Myself' : 'A group or society'}
                  </label>
                ))}
              </div>
              <div>
                <label className={labelClass} htmlFor="org-name">Name you organise under</label>
                <input id="org-name" maxLength={80} className={fieldClass} value={p.organiser?.name ?? ''} onChange={(e) => setOrg({ name: e.target.value })} />
              </div>
              <div>
                <label className={labelClass} htmlFor="org-about">About (optional)</label>
                <textarea id="org-about" maxLength={500} rows={3} className={fieldClass} value={p.organiser?.about ?? ''} onChange={(e) => setOrg({ about: e.target.value })} />
              </div>
              <p className="text-[12px] leading-relaxed text-slate-400">
                Shown as you describe it. AgoraX doesn't check organisers, so don't call yourself a registered business or a verified provider
                unless you really are one; we'll never label you as either.
              </p>
            </>
          )}
        </fieldset>
      )}

      <p className="text-[13px] leading-relaxed text-slate-300">
        This profile is shown where you appear as an organiser. It never shows which events you're interested in, what you saved, or your
        contact details.
      </p>
      {error && <p role="alert" className={errorClass}>{error}</p>}
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? 'Saving…' : 'Save profile'}
      </button>
      <CollectionNotice>This keeps the name, text and pictures you add here, publicly visible as described above.</CollectionNotice>
    </form>
  );
};

export const ProfileSheet = () => {
  const { state, actions } = useVisitor();
  return (
    <Modal isOpen={state.sheet === 'profile'} onClose={actions.closeSheet} title="Edit profile">
      {PRIVACY_NOTICE_FINAL ? <PublicProfileForm /> : <PrivateNameForm />}
    </Modal>
  );
};

const MODES: { value: UserMode; title: string; text: string }[] = [
  { value: 'attend', title: 'Attend', text: 'Find proposals, save them and say which ones you would go to.' },
  { value: 'organise', title: 'Organise', text: 'Draft and send event proposals, and see the real interest in them.' },
  { value: 'both', title: 'Both', text: 'Everything above. Most people who organise also go to things.' },
];

/** Attend / Organise / Both. One account either way; organising never means admin rights. */
export const ModeSheet = () => {
  const { state, actions } = useVisitor();
  const current = state.me?.mode ?? 'attend';
  return (
    <Modal isOpen={state.sheet === 'mode'} onClose={actions.closeSheet} title="How will you use AgoraX?">
      <div className="space-y-2" role="radiogroup" aria-label="How will you use AgoraX?">
        {MODES.map((m) => (
          <button
            key={m.value}
            role="radio"
            aria-checked={current === m.value}
            onClick={() => void actions.setMode(m.value)}
            className={`w-full rounded-sheet border p-4 text-left ${current === m.value ? 'border-brand-primary bg-brand-action/20' : 'border-sheet-line hover:border-slate-500'}`}
          >
            <span className="block font-display text-[19px] font-bold text-white">{m.title}</span>
            <span className="mt-0.5 block text-[14px] text-slate-300">{m.text}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-slate-400">
        You can change this any time from the account menu. Organiser tools are for proposing events; they don't give access to anyone's
        contact details, and they don't make you an AgoraX admin.
      </p>
    </Modal>
  );
};
