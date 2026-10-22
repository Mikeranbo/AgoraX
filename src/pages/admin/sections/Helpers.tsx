import React from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Table, Td } from '../ui';
import { downloadCsv } from '../../../lib/csv';
import type { RanBefore } from '../../../types';

const RAN_BEFORE: Record<RanBefore, string> = { yes: 'Yes', no: 'No', 'sort-of': 'Sort of' };

export function Helpers() {
  const { helperRows } = useAdmin().state;
  const exportHelpers = () =>
    downloadCsv(
      'agorax-helpers',
      ['event', 'name', 'whatsapp', 'email', 'ran_before', 'source', 'uid'],
      helperRows.map((r) => [r.event, r.name, r.phone, r.email, r.ranBefore, r.source, r.uid]),
    );
  return (
    <Section title="People who want to run an event" subtitle="“I'd help run this”, with contact details" onExport={exportHelpers}>
      <Table head={['Event', 'Name', 'WhatsApp', 'Email', 'Run one before?', 'Source']} empty="Nobody yet.">
        {helperRows.map((r) => (
          <tr key={r.key}>
            <Td className="text-white font-bold">{r.event}</Td>
            <Td>{r.name || <span className="text-slate-600">—</span>}</Td>
            <Td>{r.phone || <span className="text-slate-600">deleted or not left</span>}</Td>
            <Td>{r.email || <span className="text-slate-600">—</span>}</Td>
            <Td>{RAN_BEFORE[r.ranBefore] ?? r.ranBefore}</Td>
            <Td>{r.source}</Td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}
