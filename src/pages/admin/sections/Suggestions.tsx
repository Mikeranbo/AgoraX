import React from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Table, Td, formatTs } from '../ui';
import { downloadCsv } from '../../../lib/csv';

export function Suggestions() {
  const { suggestionRows, usersById } = useAdmin().state;
  // "Tell us" messages ([Run] / [Host] / [Idea]) come with a contact on users/{uid}; old ideas don't.
  const who = (uid: string) => {
    const u = usersById.get(uid);
    return { name: u?.name ?? '', phone: u?.phone ?? '', email: u?.email ?? '' };
  };
  const exportSuggestions = () =>
    downloadCsv(
      'agorax-suggestions',
      ['when', 'message', 'name', 'whatsapp', 'email', 'source'],
      suggestionRows.map((s) => {
        const p = who(s.uid);
        return [formatTs(s.ts), s.text, p.name, p.phone, p.email, s.source ?? ''];
      }),
    );
  return (
    <Section title="Tell us and suggestions" subtitle="Run / Host / Idea messages from the footer form, and older anonymous ideas" onExport={exportSuggestions}>
      <Table head={['When', 'Message', 'Name', 'WhatsApp', 'Email', 'Source']} empty="Nothing yet.">
        {suggestionRows.map((s) => {
          const p = who(s.uid);
          return (
            <tr key={s.id}>
              <Td className="whitespace-nowrap">{formatTs(s.ts)}</Td>
              <Td className="text-white max-w-xl whitespace-pre-wrap break-words">{s.text}</Td>
              <Td>{p.name}</Td>
              <Td className="whitespace-nowrap">{p.phone}</Td>
              <Td>{p.email}</Td>
              <Td>{s.source ?? 'direct'}</Td>
            </tr>
          );
        })}
      </Table>
    </Section>
  );
}
