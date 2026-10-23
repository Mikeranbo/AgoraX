import React from 'react';
import { Bell, ChevronRight, KeyRound, MapPin, Pencil, Shield, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tab, useVisitor } from '../state/VisitorProvider';
import { ProfileAvatar, displayNameOf } from '../components/Avatar';
import { PRIVACY_NOTICE_FINAL } from '../config/pilot';

const MODE_LABEL = { attend: 'Attending', organise: 'Organising', both: 'Attending and organising' } as const;

const SettingRow = ({ icon: Icon, label, tab }: { icon: LucideIcon; label: string; tab: Tab }) => {
  const { actions } = useVisitor();
  return (
    <button onClick={() => actions.setTab(tab)} className="flex min-h-12 w-full items-center gap-3 border-b border-sheet-line px-4 text-left text-[15px] text-white last:border-0 hover:bg-white/5">
      <Icon size={18} aria-hidden="true" className="text-slate-400" />
      <span className="flex-1">{label}</span>
      <ChevronRight size={16} aria-hidden="true" className="text-slate-400" />
    </button>
  );
};

/**
 * Cover across the content width, the picture over its lower edge, then the name and what the
 * person chose to share. Private settings are one tap away, never on the public part.
 */
export const ProfileScreen = () => {
  const { state, actions, meta } = useVisitor();
  const profile = state.profile;
  const name = displayNameOf(profile?.displayName ?? state.me?.displayName);
  const organiser = profile?.organiser?.enabled ? profile.organiser : null;
  const interests = (profile?.interests ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-16 sm:px-6">
      <section aria-label="Profile" className="sheet overflow-hidden rounded-sheet">
        <div className="relative h-36 w-full overflow-hidden sm:h-56" aria-hidden="true">
          {profile?.cover ? (
            <img src={profile.cover} alt="" className="h-full w-full object-cover" style={{ objectPosition: `50% ${profile.coverY ?? 50}%` }} />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(120deg,#6366f1_0%,#a855f7_55%,#22d3ee_130%)] opacity-60" />
          )}
        </div>
        <div className="px-4 pb-5 sm:px-6">
          <div className="-mt-12 flex items-end justify-between gap-3 sm:-mt-16">
            <span className="hidden sm:block">
              <ProfileAvatar size={128} ring />
            </span>
            <span className="sm:hidden">
              <ProfileAvatar size={96} ring />
            </span>
            <button
              onClick={() => actions.openSheet('profile')}
              className="mb-1 inline-flex min-h-11 items-center gap-2 rounded-sheet border border-brand-primary px-4 text-[15px] font-bold text-white hover:bg-brand-action/20"
            >
              <Pencil size={16} aria-hidden="true" /> Edit profile
            </button>
          </div>
          <h1 className="mt-3 font-display text-[32px] leading-tight font-extrabold tracking-[-0.02em] text-balance break-words text-white sm:text-[40px]">
            {name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-slate-300">
            {profile?.area && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} aria-hidden="true" /> {profile.area}
              </span>
            )}
            <span>{MODE_LABEL[state.me?.mode ?? 'attend']}</span>
          </p>
          {profile?.bio && <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed whitespace-pre-wrap text-slate-200">{profile.bio}</p>}
          {interests.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Interests">
              {interests.map((i) => (
                <li key={i} className="rounded-full border border-sheet-line px-3 py-1 text-[13px] text-slate-200">{i}</li>
              ))}
            </ul>
          )}
          {organiser && (
            <div className="mt-5 rounded-sheet border border-sheet-line p-4">
              <p className="text-[13px] text-slate-400">Organises as {organiser.kind === 'organisation' ? 'a group or society' : 'an individual'}</p>
              <p className="font-display text-[19px] font-bold text-white">{organiser.name}</p>
              {organiser.about && <p className="mt-1 max-w-[60ch] text-[14px] text-slate-300">{organiser.about}</p>}
              <p className="mt-2 text-[12px] text-slate-400">Self-described. AgoraX doesn't check organisers.</p>
            </div>
          )}
          <p className="mt-5 text-[13px] text-slate-400">
            {PRIVACY_NOTICE_FINAL
              ? 'Shown where you appear as an organiser. Your interests, saved events and contact details are never part of it.'
              : 'Only you see this for now. Photos, a bio and organiser profiles open once our privacy notice is final.'}
          </p>
        </div>
      </section>

      {!state.me?.mode && (
        <button
          onClick={() => actions.openSheet('mode')}
          className="sheet mt-4 flex w-full items-center gap-3 rounded-sheet p-4 text-left hover:border-slate-500"
        >
          <Sparkles size={20} aria-hidden="true" className="text-brand-secondary" />
          <span className="flex-1">
            <span className="block font-display text-[18px] font-bold text-white">Attend, organise or both?</span>
            <span className="block text-[14px] text-slate-300">Pick how you'll use AgoraX. You can change it later.</span>
          </span>
          <ChevronRight size={18} aria-hidden="true" className="text-slate-400" />
        </button>
      )}

      <h2 className="mt-8 mb-3 font-display text-[22px] font-bold text-white">Private settings</h2>
      <div className="sheet overflow-hidden rounded-sheet">
        <SettingRow icon={Bell} label="Notification preferences" tab="notifications" />
        <SettingRow icon={Shield} label="Privacy & my data" tab="data" />
        <SettingRow icon={KeyRound} label="Account & security" tab="account" />
      </div>
      <p className="mt-3 text-[13px] text-slate-400">
        {meta.picks.length} {meta.picks.length === 1 ? 'interest' : 'interests'} and {meta.savedEvents.length} saved, visible only to you.
      </p>
    </div>
  );
};
