import React, { createContext, use, useCallback, useState } from 'react';
import { AdminDoc, Event } from '../../types';
import { AdminData, useAdminData } from './useAdminData';

/**
 * composition-patterns: the provider is the only place that knows how admin state is held.
 * Sections read { state, actions, meta } from context instead of a chain of props.
 */
interface AdminContextValue {
  state: AdminData & { notice: string; editing: Event | 'new' | null };
  actions: {
    /** Runs an admin action; failures land in the error banner instead of throwing. */
    run: (label: string, fn: () => Promise<unknown>) => Promise<void>;
    setNotice: (message: string) => void;
    edit: (event: Event | 'new' | null) => void;
  };
  meta: { uid: string; admin: AdminDoc; canEdit: boolean; isOwner: boolean };
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ uid, admin, children }: { uid: string; admin: AdminDoc; children: React.ReactNode }) {
  const canEdit = admin.role === 'owner' || admin.role === 'editor';
  const isOwner = admin.role === 'owner';
  // Viewers see aggregates only: no names, contact details or admin list (the rules agree).
  const data = useAdminData({ people: canEdit, admins: isOwner });
  const { addError } = data;
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<Event | 'new' | null>(null);

  const run = useCallback(
    async (label: string, fn: () => Promise<unknown>) => {
      setNotice('');
      try {
        await fn();
      } catch (err: any) {
        console.error(err);
        addError(`${label}: ${err?.message ?? err}`);
      }
    },
    [addError],
  );

  const value: AdminContextValue = {
    state: { ...data, notice, editing },
    actions: { run, setNotice, edit: setEditing },
    meta: { uid, admin, canEdit, isOwner },
  };

  return <AdminContext value={value}>{children}</AdminContext>;
}

export function useAdmin(): AdminContextValue {
  const ctx = use(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
  return ctx;
}
