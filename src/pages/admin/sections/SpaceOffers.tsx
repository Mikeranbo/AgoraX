import React from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Table, Td, formatTs } from '../ui';
import { downloadCsv } from '../../../lib/csv';

export function SpaceOffers() {
  const { offerRows } = useAdmin().state;
  const exportOffers = () =>
    downloadCsv('agorax-venue-offers', ['when', 'name', 'space', 'contact', 'source'], offerRows.map((o) => [formatTs(o.ts), o.name, o.spaceType, o.contact, o.source ?? '']));
  return (
    <Section title="People with a space" subtitle="“I have a space” submissions" onExport={exportOffers}>
      <Table head={['When', 'Name', 'Space', 'Contact', 'Source']} empty="No offers yet.">
        {offerRows.map((o) => (
          <tr key={o.id}>
            <Td className="whitespace-nowrap">{formatTs(o.ts)}</Td>
            <Td className="text-white font-bold">{o.name}</Td>
            <Td>{o.spaceType}</Td>
            <Td>{o.contact}</Td>
            <Td>{o.source ?? 'direct'}</Td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}
