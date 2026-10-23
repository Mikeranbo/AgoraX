import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { useVisitor } from '../state/VisitorProvider';
import { CONSENT_TEXTS, ConsentPurpose } from '../data/consent';
import { maskPhone } from '../data/contact';
import { timestampMillis } from '../services/firebaseService';
import { CONTACT_EMAIL, PRIVACY_NOTICE_FINAL } from '../config/pilot';
import type { DeletionReport } from '../services/accountService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (ts: any) => {
  const ms = timestampMillis(ts);
  if (!ms) return '';
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const ScreenTitle = ({ children }: { children: React.ReactNode }) => (
  <h1 className="mb-6 font-display leading-[0.95] font-extrabold tracking-[-0.025em] text-white" style={{ fontSize: 'clamp(36px, 8vw, 56px)' }}>
    {children}
  </h1>
);

export const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="mb-3 font-display text-[22px] font-bold text-white">{title}</h2>
    <div className="sheet overflow-hidden rounded-sheet">{children}</div>
  </section>
);

export const Switch = ({ label, hint, checked, disabled, onChange }: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (on: boolean) => void;
}) => (
  <div className="flex items-start justify-between gap-4 border-b border-sheet-line px-4 py-3.5 last:border-0">
    <div>
      <p className="text-[15px] text-white">{label}</p>
      {hint && <p className="mt-1 text-[13px] leading-snug text-slate-400">{hint}</p>}
    </div>
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="grid min-h-11 shrink-0 place-items-center disabled:opacity-40"
    >
      <span className={`flex h-7 w-12 items-center rounded-full p-0.5 transition-colors motion-reduce:transition-none ${checked ? 'bg-brand-action' : 'bg-white/15'}`}>
        <span className={`size-6 rounded-full bg-white transition-transform motion-reduce:transition-none ${checked ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  </div>
);

/**
 * Each message purpose on its own switch, as consented. Turning one off is the unsubscribe:
 * there is no mailing system yet, so there are no unsubscribe links to point to.
 */
export const NotificationsScreen = () => {
  const { state, actions } = useVisitor();
  const me = state.me;
  const consents = me?.consents ?? {};
  const hasContact = !!me?.hasContact && (!!me.email || !!me.phone);
  const since = (p: ConsentPurpose) => (consents[p] ? `On since ${day(consents[p]?.at)}` : '');
  const toggle = (p: ConsentPurpose) => (on: boolean) => (on && !hasContact ? actions.openSheet('contact') : void actions.setConsent(p, on));

  return (
    <div className="mx-auto max-w-xl px-4 pt-16 sm:px-6">
      <ScreenTitle>Notification preferences</ScreenTitle>
      <p className="mb-6 max-w-[60ch] text-[15px] leading-relaxed text-slate-300">
        During the pilot we contact people by hand, by email or WhatsApp. There's no automatic mailing yet, so switching something off here
        is how you stop it. It works straight away.
      </p>

      <Block title="How we reach you">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-[15px] text-slate-200">
            {hasContact
              ? [me?.email && `Email ${me.email.charAt(0)}…@${me.email.split('@')[1] ?? ''}`, me?.phone && `WhatsApp ${maskPhone(me.phone)}`].filter(Boolean).join(' · ')
              : 'No email or number saved.'}
          </p>
          <button onClick={() => actions.openSheet('contact')} className="min-h-11 shrink-0 rounded-sheet border border-brand-primary px-4 text-[15px] font-bold text-white hover:bg-brand-action/20">
            {hasContact ? 'Change' : 'Add'}
          </button>
        </div>
      </Block>

      <Block title="About events you're interested in">
        <Switch
          label="Whether they go ahead, are cancelled or won't happen"
          hint={since('updates') || CONSENT_TEXTS.updates}
          checked={!!consents.updates}
          onChange={toggle('updates')}
        />
        {(consents.organising || me?.wantsToOrganise) && (
          <Switch label="About events I offered to help run" hint={since('organising') || CONSENT_TEXTS.organising} checked={!!consents.organising} onChange={toggle('organising')} />
        )}
        {consents.proposal && <Switch label="About events I proposed" hint={since('proposal')} checked onChange={toggle('proposal')} />}
        {(consents.space || me?.hasSpace) && <Switch label="About the space I offered" hint={since('space') || CONSENT_TEXTS.space} checked={!!consents.space} onChange={toggle('space')} />}
      </Block>

      <Block title="Optional, by email only">
        {PRIVACY_NOTICE_FINAL ? (
          <>
            <Switch
              label="When AgoraX launches"
              hint={since('launch') || CONSENT_TEXTS.launch}
              checked={!!consents.launch}
              onChange={(on) => (on && !me?.email ? actions.openSheet('contact') : void actions.setConsent('launch', on))}
            />
            <Switch
              label="Invitations to other events"
              hint={since('invites') || CONSENT_TEXTS.invites}
              checked={!!consents.invites}
              onChange={(on) => (on && !me?.email ? actions.openSheet('contact') : void actions.setConsent('invites', on))}
            />
          </>
        ) : (
          <p className="px-4 py-3 text-[14px] leading-relaxed text-slate-300">
            Launch news and invitations to other events will be offered here, off by default, once our privacy notice is final. We never use a
            WhatsApp number for these.
          </p>
        )}
      </Block>
      <p className="text-[13px] text-slate-400">Questions about messages: {CONTACT_EMAIL}</p>
    </div>
  );
};

/** No login: the account is this device. Deleting it withdraws everything that counts in public. */
export const AccountScreen = () => {
  const { state, actions } = useVisitor();
  const [step, setStep] = useState<'idle' | 'confirm' | 'busy' | 'done' | 'error'>('idle');
  const [report, setReport] = useState<DeletionReport | null>(null);
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(state.uid ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* the id is selectable text */
    }
  };

  const deleteAll = async () => {
    setStep('busy');
    try {
      setReport(await actions.deleteEverything());
      setStep('done');
    } catch (err) {
      console.error(err);
      setStep('error');
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 pt-16 sm:px-6">
      <ScreenTitle>Account &amp; security</ScreenTitle>

      <Block title="Your account">
        <div className="space-y-3 px-4 py-4 text-[15px] leading-relaxed text-slate-200">
          <p>There's no login. Your interests and settings belong to a random ID stored in this browser.</p>
          <p>
            Clearing this site's data, a private window or another device starts a new, empty account, and we can't move anything across yet.
            Anyone using this browser profile can see and change your interests.
          </p>
          <p>Organiser tools never include admin access. AgoraX grants admin access separately, by hand.</p>
          <div className="flex items-center gap-2 rounded-sheet border border-sheet-line p-3">
            <span className="text-[13px] text-slate-400">Your ID</span>
            <code className="flex-1 truncate text-[13px] text-slate-200 select-all">{state.uid}</code>
            <button onClick={copyId} aria-label="Copy your ID" className="grid size-11 place-items-center text-slate-300 hover:text-white">
              <Copy size={16} aria-hidden="true" />
            </button>
          </div>
          {copied && <p role="status" className="text-[13px] text-happening-ink">Copied.</p>}
        </div>
      </Block>

      <Block title="Delete my data">
        <div className="space-y-3 px-4 py-4 text-[15px] leading-relaxed text-slate-200">
          {step === 'done' && report ? (
            <div role="status" className="space-y-2">
              <p className="font-semibold text-white">Done. This account is deleted.</p>
              <p>
                Withdrawn: {report.interestsWithdrawn} {report.interestsWithdrawn === 1 ? 'interest' : 'interests'}, {report.helperOffersWithdrawn} helper{' '}
                {report.helperOffersWithdrawn === 1 ? 'offer' : 'offers'}. Deleted: {report.draftsDeleted} {report.draftsDeleted === 1 ? 'draft' : 'drafts'}, your profile,
                contact details and settings.
              </p>
              {report.sentProposalsKept > 0 && (
                <p>
                  {report.sentProposalsKept} proposal{report.sentProposalsKept === 1 ? ' you sent stays' : 's you sent stay'} with us until you ask:
                  email {CONTACT_EMAIL}.
                </p>
              )}
              <button onClick={() => window.location.reload()} className="min-h-11 font-semibold text-white underline underline-offset-4">
                Start fresh
              </button>
            </div>
          ) : (
            <>
              <p>This withdraws every interest and helper offer (the public numbers go down with them), and deletes your saved events, drafts, profile, contact details, settings and this account.</p>
              <p className="text-[14px] text-slate-300">
                What stays: proposals you already sent (email us to remove them), and anonymous records with no name or contact attached, such as
                suggestions, space offers and visit statistics.
              </p>
              {step === 'error' && (
                <p role="alert" className="text-[14px] text-red-300">
                  Something didn't delete. Try again, or email {CONTACT_EMAIL} and we'll do it by hand.
                </p>
              )}
              {step === 'confirm' || step === 'busy' ? (
                <p className="flex flex-wrap items-center gap-x-4">
                  <span>Delete everything? This can't be undone.</span>
                  <button onClick={() => void deleteAll()} disabled={step === 'busy'} className="min-h-11 font-bold text-red-300 underline underline-offset-4 disabled:opacity-60">
                    {step === 'busy' ? 'Deleting…' : 'Yes, delete it all'}
                  </button>
                  <button onClick={() => setStep('idle')} disabled={step === 'busy'} className="min-h-11 font-semibold text-slate-300 underline underline-offset-4">
                    Keep it
                  </button>
                </p>
              ) : (
                <button onClick={() => setStep('confirm')} className="min-h-11 font-semibold text-red-300 underline underline-offset-4">
                  Delete my data and account
                </button>
              )}
            </>
          )}
        </div>
      </Block>
    </div>
  );
};
