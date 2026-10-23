import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy } from 'lucide-react';

// There is no "claim owner" button: the first owner is provisioned by hand (docs/SECURITY.md).

export const Spinner = () => (
  <div className="min-h-screen bg-[#0f172a] flex items-center justify-center" role="status" aria-label="Loading">
    <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

/** Never crashes: anything that is not an admin (or cannot be checked) lands here with their uid. */
export const NotAuthorised = ({ uid, detail }: { uid: string; detail?: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the id is selectable text */
    }
  };
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        <h1 className="font-display text-2xl font-black text-white mb-2">Not authorised</h1>
        <p className="text-sm text-slate-400 mb-5">
          This page is for AgoraX admins. If you should have access, send an owner this ID so they can grant it:
        </p>
        {uid ? (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-3 mb-5">
            <code className="text-xs text-brand-secondary break-all flex-grow text-left select-all">{uid}</code>
            <button onClick={copy} aria-label="Copy your ID" className="p-1.5 text-slate-400 hover:text-white">
              <Copy size={16} />
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 mb-5">Your ID is unavailable because sign-in did not complete.</p>
        )}
        {copied && <p className="text-xs text-green-300 mb-3">Copied.</p>}
        {detail && <p className="text-[11px] text-slate-500 mb-5 break-words">{detail}</p>}
        <Link to="/" className="text-sm font-bold text-brand-secondary underline underline-offset-4">
          Back to AgoraX
        </Link>
      </div>
    </div>
  );
};

