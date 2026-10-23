import React, { useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { Modal } from './Modal';
import { useVisitor } from '../state/VisitorProvider';
import { LOCKED_FEATURES, LockedFeature } from '../data/features';
import { ProfileAvatar } from './Avatar';
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
        <Lock size={18} className="shrink-0 text-slate-400" aria-hidden="true" /> Not available yet — we're building it.
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

const ProfileForm = () => {
  const { state, actions } = useVisitor();
  const [name, setName] = useState(state.me?.displayName ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <p className="text-[14px] leading-snug text-slate-300">Your picture is the first letter of your name. Only you see this profile.</p>
      </div>
      <div>
        <label className={labelClass} htmlFor="display-name">Display name</label>
        <input id="display-name" maxLength={40} autoComplete="nickname" className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {error && <p role="alert" className={errorClass}>{error}</p>}
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
};

export const ProfileSheet = () => {
  const { state, actions } = useVisitor();
  return (
    <Modal isOpen={state.sheet === 'profile'} onClose={actions.closeSheet} title="Edit profile">
      <ProfileForm />
    </Modal>
  );
};
