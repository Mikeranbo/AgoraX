import React, { useState } from 'react';
import {
  Bell, Bug, ChevronRight, CircleQuestionMark, Cookie, FileText, Info, KeyRound, Languages, Lightbulb, Lock, Mail, MapPin,
  MessageCircle, Pencil, Plus, Scale, ScrollText, Shield, ShieldCheck, Smartphone, Sparkles, SunMoon, UserPlus, Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tab, useVisitor } from '../state/VisitorProvider';
import { ProfileAvatar, displayNameOf } from '../components/Avatar';
import { OrganiserBadge } from '../components/OrganiserBadge';
import { CONTACT_EMAIL, EXTRA_DATA_FEATURES } from '../config/pilot';
import { LOCKED_FEATURES, LockedFeature } from '../data/features';
import { PLAN_MAX, PLAN_MIN, applyToOrganise, withdrawApplication } from '../services/organiserAccount';
import { errorClass, fieldClass, labelClass, primaryButtonClass } from '../components/ui';

const MODE_LABEL = { attend: 'Attending', organise: 'Organising', both: 'Attending and organising' } as const;

const rowClass = 'flex min-h-12 w-full items-center gap-3 border-b border-sheet-line px-4 text-left text-[15px] text-white last:border-0 hover:bg-white/5';

/** One line in a My account list: a screen, a sheet, or a link. */
const Row = ({ icon: Icon, label, tab, onClick, href, locked }: {
  icon: LucideIcon;
  label: string;
  tab?: Tab;
  onClick?: () => void;
  href?: string;
  locked?: boolean;
}) => {
  const { actions } = useVisitor();
  const body = (
    <>
      <Icon size={18} aria-hidden="true" className="text-slate-400" />
      <span className={`flex-1 ${locked ? 'text-slate-400' : ''}`}>{label}</span>
      {locked ? <Lock size={13} aria-label="not available yet" className="text-slate-400" /> : <ChevronRight size={16} aria-hidden="true" className="text-slate-400" />}
    </>
  );
  if (href) return <a href={href} className={rowClass}>{body}</a>;
  return <button onClick={onClick ?? (() => tab && actions.setTab(tab))} className={rowClass}>{body}</button>;
};

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-8">
    <h2 className="mb-3 font-display text-[22px] font-bold text-white">{title}</h2>
    <div className="sheet overflow-hidden rounded-sheet">{children}</div>
  </section>
);

const SoonRow = ({ icon, feature }: { icon: LucideIcon; feature: LockedFeature }) => {
  const { actions } = useVisitor();
  return <Row icon={icon} label={LOCKED_FEATURES[feature]} onClick={() => actions.openLocked(feature)} locked />;
};

const BUG_MAIL = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('AgoraX bug report')}&body=${encodeURIComponent(
  'What went wrong?\n\nWhere did you find it (page, button)?\n\nPhone or laptop, and which browser?\n',
)}`;

/**
 * Participant or organiser. Anyone can apply with a few lines; an admin reads every application.
 * Approved organisers get a badge and put their own events live without waiting for review.
 */
const OrganiserAccount = () => {
  const { state, actions } = useVisitor();
  const [form, setForm] = useState(false);
  const [plan, setPlan] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const status = state.organiserStatus;

  const run = async (job: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await job();
    } catch (err) {
      console.error(err);
      setError("That didn't save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (plan.trim().length < PLAN_MIN) return setError('Write a sentence or two about what you would organise.');
    void run(async () => {
      await applyToOrganise(plan);
      setForm(false);
      setPlan('');
    });
  };

  const applyAgain = () =>
    void run(async () => {
      await withdrawApplication();
      setForm(true);
    });

  return (
    <section className="mt-8" aria-labelledby="organiser-title">
      <h2 id="organiser-title" className="mb-3 font-display text-[22px] font-bold text-white">Account type</h2>
      <div className="sheet rounded-sheet p-4 sm:p-5">
        {status === 'approved' ? (
          <>
            <p className="flex flex-wrap items-center gap-2 text-[16px] font-semibold text-white">
              Organiser <OrganiserBadge />
            </p>
            <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-slate-300">
              Your events go live straight away, with your badge. Like every proposal they start without a date, and they only run if
              enough people are interested.
            </p>
            <button onClick={() => actions.editProposal(null)} className={`${primaryButtonClass} mt-4 inline-flex items-center justify-center gap-2`}>
              <Plus size={18} aria-hidden="true" /> Create an event
            </button>
          </>
        ) : status === 'pending' ? (
          <>
            <p className="text-[16px] font-semibold text-white">Participant · organiser application sent</p>
            <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-slate-300">
              An admin will read it, and the answer shows up here. Meanwhile you can still propose events for review.
            </p>
            <button
              onClick={() => void run(withdrawApplication)}
              disabled={busy}
              className="mt-3 min-h-11 text-[15px] font-semibold text-slate-200 underline underline-offset-4 hover:text-white"
            >
              Withdraw application
            </button>
          </>
        ) : (
          <>
            <p className="text-[16px] font-semibold text-white">Participant</p>
            <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-slate-300">
              {status === 'rejected'
                ? "Your organiser application wasn't approved this time. You can still propose events for review, or apply again."
                : 'Want to run events yourself? Apply to become an organiser. Once an admin approves you, you get an organiser badge and your events go live without waiting for review.'}
            </p>
            {form ? (
              <form onSubmit={send} className="mt-4 space-y-3" noValidate>
                <div>
                  <label htmlFor="org-plan" className={labelClass}>What would you like to organise?</label>
                  <textarea
                    id="org-plan"
                    maxLength={PLAN_MAX}
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    placeholder="Monthly board-game nights for first-years. I ran something similar at my old school."
                    className={`${fieldClass} min-h-[96px]`}
                  />
                  <p className="mt-1 text-[13px] text-slate-400">Only admins read this. No contact details needed here.</p>
                </div>
                <button type="submit" disabled={busy} className={primaryButtonClass}>{busy ? 'Sending…' : 'Send application'}</button>
              </form>
            ) : (
              <button
                onClick={status === 'rejected' ? applyAgain : () => setForm(true)}
                disabled={busy}
                className="mt-4 inline-flex min-h-11 items-center rounded-sheet border border-brand-primary px-4 text-[15px] font-bold text-white hover:bg-brand-action/20"
              >
                {status === 'rejected' ? 'Apply again' : 'Apply to organise'}
              </button>
            )}
          </>
        )}
        {error && <p role="alert" className={`mt-3 ${errorClass}`}>{error}</p>}
      </div>
    </section>
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
      <p className="mb-3 text-[13px] font-semibold tracking-[0.12em] text-slate-400 uppercase">My account</p>
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
            {state.organiserStatus === 'approved' && <OrganiserBadge small />}
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
            {EXTRA_DATA_FEATURES
              ? 'Shown where you appear as an organiser. Your interests, saved events and contact details are never part of it.'
              : 'Only you see this. Photos, a bio and organiser profiles are not part of this pilot.'}
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

      <OrganiserAccount />

      <Block title="Settings">
        <Row icon={Sparkles} label="Attend, organise or both" onClick={() => actions.openSheet('mode')} />
        <Row icon={Bell} label="Notification preferences" tab="notifications" />
        <Row icon={Shield} label="Privacy & my data" tab="data" />
        <Row icon={KeyRound} label="Account & security" tab="account" />
      </Block>
      <p className="mt-3 text-[13px] text-slate-400">
        {meta.picks.length} {meta.picks.length === 1 ? 'interest' : 'interests'} and {meta.savedEvents.length} saved, visible only to you.
      </p>

      <Block title="Privacy & legal">
        <Row icon={FileText} label="Privacy Policy" tab="notice" />
        <Row icon={Scale} label="Terms of Use" tab="terms" />
        <Row icon={Cookie} label="Cookie Policy" tab="cookies" />
        <Row icon={ScrollText} label="Imprint" tab="imprint" />
      </Block>

      <Block title="Help & about">
        <Row icon={Info} label="About the pilot" onClick={actions.openPilotNotice} />
        <Row icon={Lightbulb} label="How the pilot works" tab="how" />
        <Row icon={CircleQuestionMark} label="FAQ" tab="faq" />
        <Row icon={Bug} label="Report a bug" href={BUG_MAIL} />
        <Row icon={Mail} label="Contact" href={`mailto:${CONTACT_EMAIL}`} />
        <Row icon={UserPlus} label="Invite friends" onClick={() => void actions.invite()} />
        {state.isAdmin && <Row icon={ShieldCheck} label="Admin" href="/admin" />}
      </Block>

      <Block title="Coming soon">
        <SoonRow icon={Users} feature="friends" />
        <SoonRow icon={MessageCircle} feature="messages" />
        <SoonRow icon={Languages} feature="dutch" />
        <SoonRow icon={SunMoon} feature="appearance" />
        <SoonRow icon={Smartphone} feature="devices" />
      </Block>
    </div>
  );
};
