import React from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Table, Td, formatTs } from '../ui';
import { downloadCsv } from '../../../lib/csv';
import type { SpaceType } from '../../../types';

const SPACE: Record<SpaceType, string> = { room: 'Room', hall: 'Hall', cafe: 'Café', other: 'Other' };

export function SpaceOffers() {
  const { offerRows } = useAdmin().state;
  const exportOffers = () =>
    downloadCsv(
      'agorax-space-offers',
      ['when', 'name', 'type', 'fits', 'whatsapp', 'email', 'source'],
      offerRows.map((r) => [formatTs(r.offer.ts), r.name, r.offer.spaceType, r.offer.capacity, r.phone, r.email, r.offer.source ?? '']),
    );
  return (
    <Section title="People with a space" subtitle="“I have a space” submissions" onExport={exportOffers}>
      <Table head={['When', 'Name', 'Type', 'Fits', 'WhatsApp', 'Email', 'Source']} empty="No offers yet.">
        {offerRows.map((r) => (
          <tr key={r.offer.id}>
            <Td className="whitespace-nowrap">{formatTs(r.offer.ts)}</Td>
            <Td className="text-white font-bold">{r.name || <span className="text-slate-600">—</span>}</Td>
            <Td>{SPACE[r.offer.spaceType] ?? r.offer.spaceType}</Td>
            <Td className="tabular-nums">{r.offer.capacity}</Td>
            <Td>{r.phone || <span className="text-slate-600">—</span>}</Td>
            <Td>{r.email || <span className="text-slate-600">—</span>}</Td>
            <Td>{r.offer.source ?? 'direct'}</Td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}
