import React from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Table, Td } from '../ui';
import { downloadCsv } from '../../../lib/csv';

export function BySource() {
  const { sourceRows } = useAdmin().state;
  const exportSources = () =>
    downloadCsv('agorax-sources', ['source', 'visits', 'people', 'joins', 'contacts'], sourceRows.map((r) => [r.source, r.visits, r.visitors, r.joins, r.contacts]));
  return (
    <Section title="Joins by source" subtitle="Which QR poster (?src=) people arrived from" onExport={exportSources}>
      <Table head={['Source', 'Visits', 'People who acted', 'Joins', 'Joins / visit', 'Contacts']} empty="No visits yet.">
        {sourceRows.map((r) => (
          <tr key={r.source}>
            <Td className="text-white font-bold">{r.source}</Td>
            <Td className="tabular-nums">{r.visits}</Td>
            <Td className="tabular-nums">{r.visitors}</Td>
            <Td className="tabular-nums">{r.joins}</Td>
            <Td className="tabular-nums">{r.visits ? (r.joins / r.visits).toFixed(2) : '—'}</Td>
            <Td className="tabular-nums">{r.contacts}</Td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}
