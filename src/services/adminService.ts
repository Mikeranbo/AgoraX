import {
  collection,
  collectionGroup,
  deleteField,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  query,
  where,
  DocumentReference,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AdminDoc, AdminRole, Event, EventStatus, HelperDoc, ParticipantDoc, Proposal } from '../types';
import { SEED_EVENTS } from '../data/seedEvents';
import { eventFromProposal } from '../data/proposals';
import { selectEventsToPurge } from '../data/purge';
import { chunk } from '../lib/batch';
import type { CounterFix } from '../pages/admin/recount';

type OnError = (error: Error) => void;

/** Live list of a top-level collection, each item carrying its document id as `id`. */
export function subscribeCollection<T>(
  path: string,
  callback: (items: (T & { id: string })[]) => void,
  onError?: OnError,
): Unsubscribe {
  return onSnapshot(
    collection(db, path),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })) as (T & { id: string })[]),
    (err) => onError?.(err),
  );
}

/** Every events/{id}/participants/{uid} document, in one listener. Needs no index. */
export function subscribeParticipants(callback: (items: ParticipantDoc[]) => void, onError?: OnError): Unsubscribe {
  return onSnapshot(
    collectionGroup(db, 'participants'),
    (snap) =>
      callback(
        snap.docs.map((d) => ({
          eventId: d.ref.parent.parent?.id ?? '',
          uid: d.id,
          ...d.data({ serverTimestamps: 'estimate' }),
        })) as ParticipantDoc[],
      ),
    (err) => onError?.(err),
  );
}

/** Every events/{id}/helpers/{uid} ("I'd help run this") in one listener. Contact lives on users/{uid}. */
export function subscribeHelpers(callback: (items: HelperDoc[]) => void, onError?: OnError): Unsubscribe {
  return onSnapshot(
    collectionGroup(db, 'helpers'),
    (snap) =>
      callback(
        snap.docs.map((d) => ({
          eventId: d.ref.parent.parent?.id ?? '',
          uid: d.id,
          ...d.data({ serverTimestamps: 'estimate' }),
        })) as HelperDoc[],
      ),
    (err) => onError?.(err),
  );
}

/** null = this uid has no admins/{uid} document (not an admin). */
export function subscribeToAdmin(uid: string, callback: (admin: AdminDoc | null) => void, onError?: OnError): Unsubscribe {
  return onSnapshot(
    doc(db, 'admins', uid),
    (snap) => callback(snap.exists() ? ({ uid, ...snap.data() } as AdminDoc) : null),
    (err) => onError?.(err),
  );
}

// ---------------------------------------------------------------- events

export type EventFormData = Pick<
  Event,
  | 'title'
  | 'description'
  | 'category'
  | 'price'
  | 'minParticipants'
  | 'status'
  | 'deadline'
  | 'startTime'
  | 'imageUrls'
  | 'emoji'
  | 'accent'
  | 'durationHours'
  | 'hostsNeeded'
  | 'fixedCost'
  | 'perPersonCost'
  | 'bringYourOwn'
  | 'venueNote'
  | 'season'
  | 'imageCredit'
  | 'dateConfirmed'
  | 'city'
>;

/**
 * Creates (id = null) or edits an event. Edits never touch the counters. A date left empty is
 * left out of a new event and removed from an edited one (Firestore refuses `undefined`).
 */
export async function saveEvent(id: string | null, data: EventFormData): Promise<string> {
  const defined = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  if (id) {
    const cleared = Object.fromEntries(Object.entries(data).filter(([, v]) => v === undefined).map(([k]) => [k, deleteField()]));
    await updateDoc(doc(db, 'events', id), { ...defined, ...cleared });
    return id;
  }
  const ref = await addDoc(collection(db, 'events'), {
    ...defined,
    organizerId: 'agorax',
    createdAt: serverTimestamp(),
    participantsCount: 0,
    impressions: 0,
    opens: 0,
    joins: 0,
    organiserInterest: 0,
  });
  return ref.id;
}

/** Turns a proposal into a pending event and marks the proposal approved, in one batch. */
export async function approveProposal(p: Proposal): Promise<string> {
  const eventRef = doc(collection(db, 'events'));
  const batch = writeBatch(db);
  batch.set(eventRef, {
    ...eventFromProposal(p, Date.now()),
    organizerId: 'agorax',
    createdAt: serverTimestamp(),
    participantsCount: 0,
    impressions: 0,
    opens: 0,
    joins: 0,
    organiserInterest: 0,
  });
  batch.update(doc(db, 'proposals', p.id), { status: 'approved', eventId: eventRef.id });
  await batch.commit();
  return eventRef.id;
}

export async function rejectProposal(id: string) {
  await updateDoc(doc(db, 'proposals', id), { status: 'rejected' });
}

export async function setEventStatus(id: string, status: EventStatus) {
  await updateDoc(doc(db, 'events', id), { status });
}

/**
 * Deletes the event document only. Firestore does not cascade, and the rules let people
 * remove just their own participant document, so old joins stay behind as orphans — the
 * admin page ignores any participant whose event no longer exists.
 */
export async function deleteEvent(id: string) {
  await deleteDoc(doc(db, 'events', id));
}

export interface PurgeResult {
  events: number;
  participants: number;
  comments: number;
  helpers: number;
  faces: number;
}

const BATCH_SIZE = 450;

async function deleteAll(refs: DocumentReference[]) {
  for (const group of chunk(refs, BATCH_SIZE)) {
    const batch = writeBatch(db);
    group.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

/**
 * Deletes every event that is not one of the 33 seed events (approved proposals are kept),
 * together with its participants, comments, helpers and shown initials. Firestore does not cascade, so the
 * subcollections go first and the event document last: if a run stops halfway, running it
 * again finds the same event and finishes the job.
 */
export async function purgeNonSeedEvents(): Promise<PurgeResult> {
  const snap = await getDocs(collection(db, 'events'));
  const events = snap.docs.map((d) => ({ id: d.id, origin: (d.data() as Event).origin }));
  const ids = selectEventsToPurge(events, SEED_EVENTS.map((e) => e.slug));
  const result: PurgeResult = { events: 0, participants: 0, comments: 0, helpers: 0, faces: 0 };

  for (const id of ids) {
    for (const sub of ['participants', 'comments', 'helpers', 'faces'] as const) {
      const docs = (await getDocs(collection(db, 'events', id, sub))).docs.map((d) => d.ref);
      await deleteAll(docs);
      result[sub] += docs.length;
    }
    await deleteDoc(doc(db, 'events', id));
    result.events++;
  }
  return result;
}

/**
 * Sets each event's counters to its real sign-ups (see countersToFix). Counters move with
 * increment() elsewhere, so run this when nobody is joining, and run it again if in doubt.
 */
export async function applyCounterFixes(fixes: CounterFix[]) {
  for (const group of chunk(fixes, BATCH_SIZE)) {
    const batch = writeBatch(db);
    group.forEach((f) =>
      batch.update(doc(db, 'events', f.id), {
        participantsCount: f.participantsCount,
        joins: f.participantsCount,
        organiserInterest: f.organiserInterest,
      }),
    );
    await batch.commit();
  }
}

// ---------------------------------------------------------------- feature demand

export interface FeatureSignal {
  name: 'locked_feature_click' | 'feature_vote';
  uid: string;
  feature: string;
}

/** Taps on locked sidebar items and "I want this" votes, for the Most wanted ranking. */
export function subscribeFeatureSignals(callback: (items: FeatureSignal[]) => void, onError?: OnError): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'analytics'), where('name', 'in', ['locked_feature_click', 'feature_vote'])),
    (snap) =>
      callback(
        snap.docs.map((d) => {
          const data = d.data();
          return { name: data.name, uid: data.uid, feature: String(data.payload?.feature ?? '') };
        }),
      ),
    (err) => onError?.(err),
  );
}

// ---------------------------------------------------------------- admins

/** Owners only, and never for their own uid (the rules refuse both). The first owner is provisioned by hand. */
export async function grantAdmin(targetUid: string, role: AdminRole, label: string, grantedBy: string) {
  await setDoc(doc(db, 'admins', targetUid), {
    role,
    label: label.trim().slice(0, 80),
    grantedBy,
    grantedAt: serverTimestamp(),
  });
}

export async function revokeAdmin(targetUid: string) {
  await deleteDoc(doc(db, 'admins', targetUid));
}
