import React from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from './AdminContext';
import { EventEditor } from './EventEditor';

export function Header() {
  const { uid, admin } = useAdmin().meta;
  return (
    <header className="sticky top-0 z-30 bg-[#0f172a]/90 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-lg font-black text-white">AgoraX <span className="text-brand-secondary">admin</span></h1>
          <span className="px-2 py-0.5 rounded-md bg-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-wider">{admin.role}</span>
          {admin.label && <span className="text-xs text-slate-500">{admin.label}</span>}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <code className="text-slate-600 hidden sm:inline" title="Your uid">{uid}</code>
          <Link to="/" className="font-bold text-brand-secondary hover:text-white">Public page →</Link>
        </div>
      </div>
    </header>
  );
}

export function Banners() {
  const {
    state: { errors, notice, clearErrors },
    meta: { canEdit },
  } = useAdmin();
  return (
    <>
      {!canEdit && (
        <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
          Viewer access shows event totals only. Visitor counts, price answers, names and contact details need editor access.
        </div>
      )}
      {errors.length > 0 && (
        <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
          <p className="font-bold mb-1">Some data could not be loaded or saved:</p>
          <ul className="list-disc pl-5 space-y-0.5 break-words">
            {errors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <p className="mt-2 text-red-300/70">Most often this means the new Firestore rules have not been published yet (see README).</p>
          <button onClick={clearErrors} className="mt-2 underline font-bold">Dismiss</button>
        </div>
      )}
      {notice && <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-xs text-green-200">{notice}</div>}
    </>
  );
}

export function Editor() {
  const {
    state: { editing },
    actions: { edit, setNotice },
  } = useAdmin();
  if (!editing) return null;
  return <EventEditor event={editing === 'new' ? null : editing} onClose={() => edit(null)} onSaved={setNotice} />;
}
