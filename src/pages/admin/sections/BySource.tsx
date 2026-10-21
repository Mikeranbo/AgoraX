import React from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Table, Td } from '../ui';
import { downloadCsv } from '../../../lib/csv';

export function BySource() {
  const { sourceRows } = useAdmin().state;
  const exportSources = () =>
    downloadCsv('agorax-sources', ['source', 'visitors', 'joins', 'contacts'], sourceRows.map((r) => [r.source, r.visitors, r.joins, r.contacts]));
  return (
    <Section title="Joins by source" subtitle="Which QR poster (?src=) people arrived from" onExport={exportSources}>
      <Table head={['Source', 'Visitors', 'Joins', 'Joins / visitor', 'Contacts']} empty="No visitors yet.">
        {sourceRows.map((r) => (
          <tr key={r.source}>
            <Td className="text-white font-bold">{r.source}</Td>
            <Td className="tabular-nums">{r.visitors}</Td>
            <Td className="tabular-nums">{r.joins}</Td>
            <Td className="tabular-nums">{r.visitors ? (r.joins / r.visitors).toFixed(2) : '—'}</Td>
            <Td className="tabular-nums">{r.contacts}</Td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}
