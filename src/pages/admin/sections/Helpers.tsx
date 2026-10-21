import React from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Table, Td } from '../ui';
import { downloadCsv } from '../../../lib/csv';

export function Helpers() {
  const { hostingRows } = useAdmin().state;
  const exportHosting = () =>
    downloadCsv('agorax-hosting-interest', ['event', 'name', 'whatsapp', 'email', 'source', 'uid'], hostingRows.map((r) => [r.event, r.name, r.phone, r.email, r.source, r.uid]));
  return (
    <Section title="People who want to run an event" subtitle="Tapped “I'd help run this”" onExport={exportHosting}>
      <Table head={['Event', 'Name', 'WhatsApp', 'Email', 'Source']} empty="Nobody yet.">
        {hostingRows.map((r) => (
          <tr key={r.key}>
            <Td className="text-white font-bold">{r.event}</Td>
            <Td>{r.name || <span className="text-slate-600">—</span>}</Td>
            <Td>{r.phone || <span className="text-slate-600">no contact left</span>}</Td>
            <Td>{r.email || <span className="text-slate-600">—</span>}</Td>
            <Td>{r.source}</Td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}
