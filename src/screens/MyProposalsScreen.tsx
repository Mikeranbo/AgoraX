import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useVisitor } from '../state/VisitorProvider';
import { deleteDraft } from '../services/organiserService';
import { timestampMillis } from '../services/firebaseService';
import { primaryButtonClass } from '../components/ui';
import type { Proposal } from '../types';

const GROUPS: { status: Proposal['status']; title: string; note: string }[] = [
  { status: 'draft', title: 'Drafts', note: 'Only you can see these until you send them.' },
  { status: 'new', title: 'Sent for review', note: "We read every proposal. Once it's sent it can't be edited here; email us to change it." },
  { status: 'approved', title: 'Live as proposals', note: 'The numbers are real: people who said they are interested, and people who offered to help.' },
  { status: 'rejected', title: 'Not taken forward', note: "These didn't fit this pilot. You can propose something else any time." },
];

const smallButton =
  'inline-flex min-h-11 items-center gap-2 rounded-sheet border border-sheet-line px-3 text-[15px] font-semibold text-slate-200 hover:border-slate-500 hover:text-white disabled:opacity-60';

const Row = ({ p }: { p: Proposal }) => {
  const { state, actions } = useVisitor();
  const [busy, setBusy] = useState(false);
  const event = p.eventId ? state.events.find((e) => e.id === p.eventId) : undefined;

  const remove = async () => {
    if (!window.confirm(`Delete the draft "${p.title}"? This can't be undone.`)) return;
    setBusy(true);
    try {
      await deleteDraft(p.id);
    } catch (err) {
      console.error(err);
      actions.showToast("That didn't delete. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <li className="sheet rounded-sheet p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[19px] leading-tight font-bold break-words text-white">{p.title}</p>
          <p className="mt-0.5 text-[13px] text-slate-400">
            {p.category} · indicative €{p.price} · target {p.minPeople}
          </p>
        </div>
      </div>
      {p.status === 'approved' && (
        <p className="mt-3 text-[15px] text-slate-200 tabular-nums">
          {event ? (
            <>
              <span className="font-semibold text-white">{event.participantsCount ?? 0} interested</span> of {event.minParticipants} ·{' '}
              {event.organiserInterest ?? 0} offered to help ·{' '}
              <button onClick={() => actions.open(event)} className="font-semibold text-brand-secondary underline underline-offset-4">
                Open
              </button>
            </>
          ) : (
            'Approved. The proposal page is being set up.'
          )}
        </p>
      )}
      {p.status === 'draft' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => actions.editProposal(p)} className={smallButton}>
            <Pencil size={16} aria-hidden="true" /> Edit, preview or send
          </button>
          <button onClick={remove} disabled={busy} className={smallButton}>
            <Trash2 size={16} aria-hidden="true" /> {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      )}
    </li>
  );
};

/** The author's own proposals. Only they and admins can read them (firestore.rules). */
export const MyProposalsScreen = () => {
  const { state, actions } = useVisitor();
  const sorted = [...state.myProposals].sort((a, b) => timestampMillis(b.ts) - timestampMillis(a.ts));

  return (
    <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6">
      <h1 className="mb-2 font-display text-[30px] leading-tight font-bold text-white">My proposals</h1>
      <p className="mb-6 max-w-[60ch] text-[15px] text-slate-300">
        Ideas you've drafted or sent. You only ever see totals, never who is interested.
      </p>

      {!state.myProposalsLoaded ? (
        <p role="status" className="text-[15px] text-slate-300">Loading…</p>
      ) : sorted.length === 0 ? (
        <div className="sheet rounded-sheet p-5 text-center">
          <p className="font-display text-[20px] font-bold text-white">No proposals yet</p>
          <p className="mt-1 mb-5 text-[15px] text-slate-300">Got an idea for something you'd run or go to? It takes a minute.</p>
          <button onClick={() => actions.editProposal(null)} className={primaryButtonClass}>
            Propose an event
          </button>
        </div>
      ) : (
        GROUPS.map((g) => {
          const items = sorted.filter((p) => p.status === g.status);
          if (items.length === 0) return null;
          return (
            <section key={g.status} className="mb-8">
              <h2 className="font-display text-[22px] font-bold text-white">{g.title}</h2>
              <p className="mb-3 text-[13px] text-slate-400">{g.note}</p>
              <ul className="space-y-3">
                {items.map((p) => (
                  <Row key={p.id} p={p} />
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
};
