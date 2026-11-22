import React, { useState } from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Table, Td, formatTs } from '../ui';
import { downloadCsv } from '../../../lib/csv';
import { deleteAllContactData } from '../../../services/adminService';

/**
 * Owner only. Deletes every contact detail at once: at the latest on 30 June 2027 (privacy
 * notice 1.1, section 6), or sooner. Two steps, so one stray click can't do it.
 */
export function ContactData() {
  const {
    state: { stats, users, events },
    actions: { run, setNotice },
  } = useAdmin();
  // Who to message, and about what: everyone with a number or email, with the events they picked.
  const titles = new Map(events.map((e) => [e.id, e.title]));
  const picksOf = new Map<string, string[]>();
  stats.joins.forEach((p) => picksOf.set(p.uid, [...(picksOf.get(p.uid) ?? []), titles.get(p.eventId) ?? p.eventId]));
  const people = users
    .filter((u) => u.hasContact && (u.email || u.phone))
    .map((u) => ({
      id: u.id,
      name: u.name ?? '',
      phone: u.phone ?? '',
      email: u.email ?? '',
      picks: picksOf.get(u.id) ?? [],
      source: u.source ?? 'direct',
      consents: Object.keys(u.consents ?? {}).join(', '),
      since: formatTs(u.createdAt),
    }));
  const exportPeople = () =>
    downloadCsv(
      'agorax-contacts',
      ['name', 'whatsapp', 'email', 'picked', 'source', 'consents', 'since'],
      people.map((p) => [p.name, p.phone, p.email, p.picks.join('; '), p.source, p.consents, p.since]),
    );
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
    <Section title="Contact data" subtitle="Keep until 30 June 2027 at the latest (privacy notice, section 6)" onExport={exportPeople}>
      <div className="mb-3">
        <Table head={['Name', 'WhatsApp', 'Email', 'Picked', 'Source', 'Agreed to', 'Since']} empty="Nobody has left a number or email yet.">
          {people.map((p) => (
            <tr key={p.id}>
              <Td className="text-white">{p.name}</Td>
              <Td className="whitespace-nowrap text-white">{p.phone}</Td>
              <Td className="text-white">{p.email}</Td>
              <Td className="min-w-[14rem]">{p.picks.join(', ') || '—'}</Td>
              <Td>{p.source}</Td>
              <Td>{p.consents}</Td>
              <Td className="whitespace-nowrap">{p.since}</Td>
            </tr>
          ))}
        </Table>
      </div>
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
