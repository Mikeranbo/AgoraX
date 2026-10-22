import React, { useState } from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Table, Td } from '../ui';
import { downloadCsv } from '../../../lib/csv';
import { grantAdmin, revokeAdmin } from '../../../services/adminService';
import { AdminDoc, AdminRole } from '../../../types';

export function Admins() {
  const {
    state: { adminRows },
    actions: { run, setNotice },
    meta: { uid, isOwner },
  } = useAdmin();
  const [grantUid, setGrantUid] = useState('');
  const [grantRole, setGrantRole] = useState<AdminRole>('viewer');
  const [grantLabel, setGrantLabel] = useState('');

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault();
    const target = grantUid.trim();
    if (!target) return;
    void run('Grant admin', async () => {
      await grantAdmin(target, grantRole, grantLabel, uid);
      setNotice(`Granted ${grantRole} to ${target}.`);
      setGrantUid('');
      setGrantLabel('');
    });
  };

  const handleRevoke = (a: AdminDoc) => {
    if (!window.confirm(`Revoke ${a.label || a.uid}?`)) return;
    void run('Revoke admin', async () => {
      await revokeAdmin(a.uid);
      setNotice(`Revoked ${a.label || a.uid}.`);
    });
  };

  const exportAdmins = () =>
    downloadCsv('agorax-admins', ['uid', 'role', 'label', 'granted_by'], adminRows.map((a) => [a.uid, a.role, a.label ?? '', a.grantedBy ?? '']));

  return (
    <Section title="Admins" subtitle={isOwner ? 'Owners can grant and revoke access' : 'Only owners can change this list'} onExport={exportAdmins}>
      <Table head={['Label', 'Role', 'uid', 'Granted by', ...(isOwner ? [''] : [])]} empty="No admins.">
        {adminRows.map((a) => (
          <tr key={a.uid}>
            <Td className="text-white font-bold">
              {a.label || '—'}
              {a.uid === uid && <span className="ml-2 text-[10px] text-brand-secondary">(you)</span>}
            </Td>
            <Td>{a.role}</Td>
            <Td>
              <code className="text-[11px] break-all">{a.uid}</code>
            </Td>
            <Td>
              <code className="text-[11px] break-all">{a.grantedBy ?? '—'}</code>
            </Td>
            {isOwner && (
              <Td>
                {a.uid !== uid && (
                  <button onClick={() => handleRevoke(a)} className="px-2 py-1 rounded text-[11px] font-bold text-red-300 hover:bg-red-500/20">
                    Revoke
                  </button>
                )}
              </Td>
            )}
          </tr>
        ))}
      </Table>

      {isOwner && (
        <form onSubmit={handleGrant} className="glass rounded-2xl p-4 mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] items-end">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">uid to grant</label>
            <input value={grantUid} onChange={(e) => setGrantUid(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Role</label>
            <select value={grantRole} onChange={(e) => setGrantRole(e.target.value as AdminRole)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white">
              {(['viewer', 'editor', 'owner'] as AdminRole[]).map((r) => (
                <option key={r} value={r} className="bg-[#0f172a]">
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Label</label>
            <input value={grantLabel} onChange={(e) => setGrantLabel(e.target.value)} placeholder="e.g. Anna" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white" />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg gradient-brand text-white text-xs font-black">
            Grant
          </button>
        </form>
      )}
    </Section>
  );
}
