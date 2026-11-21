import React, { useState } from 'react';
import { useAdmin } from '../AdminContext';
import { Section } from '../ui';
import { deleteAllContactData } from '../../../services/adminService';

/**
 * Owner only. Deletes every contact detail at once: at the latest on 30 June 2027 (privacy
 * notice 1.1, section 6), or sooner. Two steps, so one stray click can't do it.
 */
export function ContactData() {
  const {
    state: { stats },
    actions: { run, setNotice },
  } = useAdmin();
  const [step, setStep] = useState<'idle' | 'confirm' | 'busy'>('idle');

  const wipe = () =>
    run('Delete all contact data', async () => {
      setStep('busy');
      try {
        const { people, initials } = await deleteAllContactData();
        setNotice(`Deleted the contact details of ${people} ${people === 1 ? 'person' : 'people'} and ${initials} shown ${initials === 1 ? 'initial' : 'initials'}.`);
      } finally {
        setStep('idle');
      }
    });

  return (
    <Section title="Contact data" subtitle="Keep until 30 June 2027 at the latest (privacy notice, section 6)">
      <div className="glass rounded-2xl p-4 text-sm text-slate-300 space-y-3">
        <p>
          {stats.contacts} {stats.contacts === 1 ? 'person has' : 'people have'} left a WhatsApp number or email. Deleting removes every number,
          email, first name and consent, and every initial shown on an event. Interests, offers and counts stay, without anything that
          identifies a person. Also delete your WhatsApp and Gmail conversations with them by hand.
        </p>
        {step === 'idle' ? (
          <button onClick={() => setStep('confirm')} className="rounded-xl border border-red-400/50 px-4 py-2 font-bold text-red-300 hover:bg-red-500/10">
            Delete all contact data
          </button>
        ) : (
          <div role="alertdialog" aria-label="Confirm deleting all contact data" className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-white">Delete all contact data for everyone? This can't be undone.</span>
            <button
              onClick={() => void wipe()}
              disabled={step === 'busy'}
              className="rounded-xl bg-red-500/80 px-4 py-2 font-bold text-white hover:bg-red-500 disabled:opacity-60"
            >
              {step === 'busy' ? 'Deleting…' : 'Yes, delete it all'}
            </button>
            <button onClick={() => setStep('idle')} disabled={step === 'busy'} className="px-2 py-2 font-bold text-slate-300 underline">
              Cancel
            </button>
          </div>
        )}
      </div>
    </Section>
  );
}
