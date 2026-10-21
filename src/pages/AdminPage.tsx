import React, { useEffect, useState } from 'react';
import { ensureAnonymousAuth, describeAuthError } from '../services/identity';
import { subscribeToAdmin } from '../services/adminService';
import { AdminDoc } from '../types';
import { AdminProvider } from './admin/AdminContext';
import { NotAuthorised, Spinner } from './admin/Gate';
import { Banners, Editor, Header } from './admin/Chrome';
import { Overview } from './admin/sections/Overview';
import { Funnel } from './admin/sections/Funnel';
import { EventsTable } from './admin/sections/EventsTable';
import { BySource } from './admin/sections/BySource';
import { PriceAnswers } from './admin/sections/PriceAnswers';
import { Helpers } from './admin/sections/Helpers';
import { SpaceOffers } from './admin/sections/SpaceOffers';
import { Suggestions } from './admin/sections/Suggestions';
import { Admins } from './admin/sections/Admins';

export default function AdminPage() {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [uid, setUid] = useState('');
  const [admin, setAdmin] = useState<AdminDoc | null | undefined>(undefined);
  const [detail, setDetail] = useState('');

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    document.title = 'AgoraX admin';

    ensureAnonymousAuth()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        setPhase('ready');
        unsubscribe = subscribeToAdmin(
          user.uid,
          (doc) => setAdmin(doc),
          (err) => {
            // Usually: the new Firestore rules have not been published yet.
            setDetail(`Could not check admin access: ${err.message}`);
            setAdmin(null);
          },
        );
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setDetail(describeAuthError(err));
        setPhase('error');
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  if (phase === 'loading' || (phase === 'ready' && admin === undefined)) return <Spinner />;
  if (phase === 'error' || !admin) return <NotAuthorised uid={uid} detail={detail} />;
  return <Dashboard uid={uid} admin={admin} />;
}

// ---------------------------------------------------------------------------

function Dashboard({ uid, admin }: { uid: string; admin: AdminDoc }) {
  return (
    <AdminProvider uid={uid} admin={admin}>
      <div className="min-h-screen bg-[#0f172a] text-slate-200">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Banners />
          <Overview />
          <Funnel />
          <EventsTable />
          <BySource />
          <PriceAnswers />
          <Helpers />
          <SpaceOffers />
          <Suggestions />
          <Admins />
        </main>
        <Editor />
      </div>
    </AdminProvider>
  );
}
