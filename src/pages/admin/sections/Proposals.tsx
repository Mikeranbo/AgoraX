import React from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Table, Td, formatTs } from '../ui';
import { downloadCsv } from '../../../lib/csv';
import { approveProposal, rejectProposal } from '../../../services/adminService';
import type { Proposal } from '../../../types';

const STATUS: Record<Proposal['status'], string> = { draft: 'Draft', new: 'Waiting', approved: 'Approved', rejected: 'Rejected' };

/** APP_CHANGES §9/§12: proposals stay out of the feed until an editor approves one. */
export function Proposals() {
  const {
    state: { proposalRows },
    actions: { run, setNotice },
    meta: { canEdit },
  } = useAdmin();

  const approve = (p: Proposal) => {
    if (!window.confirm(`Turn “${p.title}” into an event? It appears in the feed straight away.`)) return;
    void run('Approve proposal', async () => {
      await approveProposal(p);
      setNotice(`“${p.title}” is now an event. Edit it in the events table to add an emoji, costs and a description.`);
    });
  };

  const reject = (p: Proposal) => {
    void run('Reject proposal', async () => {
      await rejectProposal(p.id);
      setNotice(`Rejected “${p.title}”.`);
    });
  };

  const exportProposals = () =>
    downloadCsv(
      'agorax-proposals',
      ['when', 'title', 'category', 'price', 'people', 'needs', 'name', 'whatsapp', 'status', 'source'],
      proposalRows.map((r) => [formatTs(r.proposal.ts), r.proposal.title, r.proposal.category, r.proposal.price, r.proposal.minPeople, r.proposal.needs, r.name, r.phone, r.proposal.status, r.proposal.source]),
    );

  return (
    <Section title="Proposals" subtitle="Ideas from students — not in the feed until approved" onExport={exportProposals}>
      <Table head={['When', 'Photo', 'Idea', 'Category', '€', 'People', 'What they need', 'Name', 'WhatsApp', 'Status', ...(canEdit ? [''] : [])]} empty="No proposals yet.">
        {proposalRows.map(({ proposal: p, name, phone }) => (
          <tr key={p.id} className={p.status === 'rejected' ? 'opacity-50' : ''}>
            <Td className="whitespace-nowrap">{formatTs(p.ts)}</Td>
            <Td>
              {p.image ? (
                <img src={p.image} alt="" title={p.imageCredit} className="h-12 w-20 rounded object-cover" />
              ) : (
                <span className="text-slate-600">—</span>
              )}
            </Td>
            <Td className="text-white font-bold min-w-[10rem]">{p.title}</Td>
            <Td>{p.category}</Td>
            <Td className="tabular-nums">{p.price === 0 ? 'Free' : p.price}</Td>
            <Td className="tabular-nums">{p.minPeople}</Td>
            <Td className="max-w-xs whitespace-pre-wrap break-words">{p.needs || <span className="text-slate-600">—</span>}</Td>
            <Td>{name || <span className="text-slate-600">—</span>}</Td>
            <Td>{phone || <span className="text-slate-600">deleted</span>}</Td>
            <Td>{STATUS[p.status]}</Td>
            {canEdit && (
              <Td>
                {p.status === 'new' && (
                  <div className="flex gap-1">
                    <button onClick={() => approve(p)} className="px-2 py-1 rounded text-[11px] font-bold text-green-300 hover:bg-green-500/20">
                      Approve
                    </button>
                    <button onClick={() => reject(p)} className="px-2 py-1 rounded text-[11px] font-bold text-slate-400 hover:bg-white/10">
                      Reject
                    </button>
                  </div>
                )}
              </Td>
            )}
          </tr>
        ))}
      </Table>
    </Section>
  );
}
