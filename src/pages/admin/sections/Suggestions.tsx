import React from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Table, Td, formatTs } from '../ui';
import { downloadCsv } from '../../../lib/csv';

export function Suggestions() {
  const { suggestionRows } = useAdmin().state;
  const exportSuggestions = () =>
    downloadCsv('agorax-suggestions', ['when', 'suggestion', 'source'], suggestionRows.map((s) => [formatTs(s.ts), s.text, s.source ?? '']));
  return (
    <Section title="Suggestions" subtitle="“An event you'd join that isn't here?” — anonymous" onExport={exportSuggestions}>
      <Table head={['When', 'Suggestion', 'Source']} empty="No suggestions yet.">
        {suggestionRows.map((s) => (
          <tr key={s.id}>
            <Td className="whitespace-nowrap">{formatTs(s.ts)}</Td>
            <Td className="text-white max-w-xl whitespace-pre-wrap break-words">{s.text}</Td>
            <Td>{s.source ?? 'direct'}</Td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}
