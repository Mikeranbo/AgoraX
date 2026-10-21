import React, { useState } from 'react';
import { Pencil, Plus, Sprout, Trash2 } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { Bar, Section, Table, Td, pct } from '../ui';
import { downloadCsv } from '../../../lib/csv';
import { seedEvents } from '../../../services/firebaseService';
import { deleteEvent, setEventStatus } from '../../../services/adminService';
import { Event, EventStatus } from '../../../types';

const STATUS_OPTIONS: EventStatus[] = ['Pending', 'Confirmed', 'Cancelled'];

export function EventsTable() {
  const {
    state: { eventRows },
    actions: { run, setNotice, edit },
    meta: { canEdit },
  } = useAdmin();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!window.confirm('Write the 33 seed events? New ones are created; existing ones only get their copy/price/cost fields refreshed — signups, counters, status and photos are kept.')) return;
    setSeeding(true);
    await run('Seed events', async () => {
      const { created, updated } = await seedEvents();
      setNotice(`Seeded: ${created} created, ${updated} updated.`);
    });
    setSeeding(false);
  };

  const handleDelete = (e: Event) => {
    if (!window.confirm(`Delete “${e.title}”? Its sign-ups stop counting. This cannot be undone.`)) return;
    void run('Delete event', async () => {
      await deleteEvent(e.id);
      setNotice(`Deleted “${e.title}”.`);
    });
  };

  const exportEvents = () =>
    downloadCsv(
      'agorax-events',
      ['id', 'title', 'category', 'price', 'minimum', 'joins', 'impressions', 'opens', 'open_to_join', 'organiser_interest', 'status'],
      eventRows.map((r) => [r.event.id, r.event.title, r.event.category, r.event.price, r.event.minParticipants, r.joins, r.impressions, r.opens, r.conversion === null ? '' : r.conversion.toFixed(3), r.interest, r.event.status]),
    );

  return (
    <Section
      title="Events"
      subtitle="Sorted by joins"
      onExport={exportEvents}
      actions={
        canEdit && (
          <>
            <button onClick={() => edit('new')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-brand text-white text-xs font-black">
              <Plus size={12} /> New event
            </button>
            <button onClick={handleSeed} disabled={seeding} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs font-bold text-slate-200 hover:text-white disabled:opacity-50">
              <Sprout size={12} /> {seeding ? 'Seeding…' : 'Seed events'}
            </button>
          </>
        )
      }
    >
      <Table
        head={['Event', 'Category', '€', 'Min', 'Joins', 'Progress', 'Impr.', 'Opens', 'Open→join', 'Host int.', 'Status', ...(canEdit ? ['Actions'] : [])]}
        empty="No events yet — use “Seed events” to add the 33."
      >
        {eventRows.map(({ event: e, joins, impressions, opens, conversion, interest }) => (
          <tr key={e.id} className={e.status === 'Cancelled' ? 'opacity-50' : ''}>
            <Td className="min-w-[12rem] text-white font-bold">
              <span className="mr-1.5">{e.emoji ?? '🎟️'}</span>
              {e.title}
            </Td>
            <Td>{e.category}</Td>
            <Td className="tabular-nums">{e.price === 0 ? 'Free' : e.price}</Td>
            <Td className="tabular-nums">{e.minParticipants}</Td>
            <Td className="tabular-nums text-white font-bold">{joins}</Td>
            <Td>
              <div className="flex items-center gap-2">
                <Bar value={joins} max={e.minParticipants} color={joins >= e.minParticipants ? 'bg-green-400' : 'bg-brand-secondary'} />
                <span className="tabular-nums text-slate-500">{pct(joins, e.minParticipants)}</span>
              </div>
            </Td>
            <Td className="tabular-nums">{impressions}</Td>
            <Td className="tabular-nums">{opens}</Td>
            <Td className="tabular-nums">{conversion === null ? '—' : `${Math.round(conversion * 100)}%`}</Td>
            <Td className="tabular-nums">{interest}</Td>
            <Td>
              {canEdit ? (
                <select
                  value={e.status}
                  onChange={(ev) => void run('Set status', () => setEventStatus(e.id, ev.target.value as EventStatus))}
                  className="bg-white/5 border border-white/10 rounded px-1.5 py-1 text-xs text-white"
                  aria-label={`Status of ${e.title}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-[#0f172a]">
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                e.status
              )}
            </Td>
            {canEdit && (
              <Td>
                <div className="flex gap-1">
                  <button onClick={() => edit(e)} aria-label={`Edit ${e.title}`} className="p-1.5 rounded hover:bg-white/10 text-slate-300">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(e)} aria-label={`Delete ${e.title}`} className="p-1.5 rounded hover:bg-red-500/20 text-red-300">
                    <Trash2 size={13} />
                  </button>
                </div>
              </Td>
            )}
          </tr>
        ))}
      </Table>
    </Section>
  );
}
