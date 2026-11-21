import React, { useEffect, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Table, Td, formatTs } from '../ui';
import { decideApplication, subscribeApplications } from '../../../services/organiserAccount';
import type { OrganiserApplication } from '../../../types';

const STATUS: Record<OrganiserApplication['status'], string> = { pending: 'Waiting', approved: 'Approved', rejected: 'Declined' };

/**
 * Who asked to become an organiser. Approving gives them the organiser badge and lets them put
 * their own events live without review; it can be taken back here at any time.
 */
export function OrganiserApplications() {
  const {
    state: { usersById, addError },
    actions: { run, setNotice },
    meta: { isOwner: canEdit },
  } = useAdmin();
  const [list, setList] = useState<OrganiserApplication[]>([]);

  useEffect(() => subscribeApplications(setList, (e) => addError(`organiser applications: ${(e as Error).message}`)), [addError]);

  const decide = (a: OrganiserApplication, status: 'approved' | 'rejected' | 'pending', label: string) =>
    void run(label, async () => {
      await decideApplication(a.uid, status);
      setNotice(`${label}: ${usersById.get(a.uid)?.name || a.uid.slice(0, 8)}.`);
    });

  return (
    <Section title="Organiser applications" subtitle="Approved organisers get a badge and publish their own events without review">
      <Table head={['When', 'Who', 'What they want to organise', 'Status', ...(canEdit ? [''] : [])]} empty="No applications yet.">
        {list.map((a) => {
          const user = usersById.get(a.uid);
          return (
            <tr key={a.uid} className={a.status === 'rejected' ? 'opacity-50' : ''}>
              <Td className="whitespace-nowrap">{formatTs(a.ts)}</Td>
              <Td>
                <span className="font-bold text-white">{user?.name || 'No name given'}</span>
                <span className="block text-slate-500">{user?.email || user?.phone || `uid ${a.uid.slice(0, 8)}…`}</span>
              </Td>
              <Td className="max-w-md whitespace-pre-wrap break-words">{a.plan}</Td>
              <Td>{STATUS[a.status]}</Td>
              {canEdit && (
                <Td>
                  <div className="flex gap-1">
                    {a.status !== 'approved' && (
                      <button onClick={() => decide(a, 'approved', 'Approved organiser')} className="rounded px-2 py-1 text-[11px] font-bold text-green-300 hover:bg-green-500/20">
                        Approve
                      </button>
                    )}
                    {a.status === 'pending' && (
                      <button onClick={() => decide(a, 'rejected', 'Declined application')} className="rounded px-2 py-1 text-[11px] font-bold text-slate-400 hover:bg-white/10">
                        Decline
                      </button>
                    )}
                    {a.status === 'approved' && (
                      <button onClick={() => decide(a, 'rejected', 'Took back organiser approval')} className="rounded px-2 py-1 text-[11px] font-bold text-red-300 hover:bg-red-500/20">
                        Take back
                      </button>
                    )}
                  </div>
                </Td>
              )}
            </tr>
          );
        })}
      </Table>
    </Section>
  );
}
