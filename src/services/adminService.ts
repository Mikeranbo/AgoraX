import {
  collection,
  collectionGroup,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  DocumentReference,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AdminDoc, AdminRole, Event, EventStatus, ParticipantDoc, Proposal } from '../types';
import { SEED_EVENTS } from '../data/seedEvents';
import { eventFromProposal } from '../data/proposals';
import { selectEventsToPurge } from '../data/purge';
import { chunk } from '../lib/batch';

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
>;

/** Creates (id = null) or edits an event. Edits never touch the counters. */
export async function saveEvent(id: string | null, data: EventFormData): Promise<string> {
  if (id) {
    await updateDoc(doc(db, 'events', id), { ...data });
    return id;
  }
  const ref = await addDoc(collection(db, 'events'), {
    ...data,
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
 * together with its participants, comments and helpers. Firestore does not cascade, so the
 * subcollections go first and the event document last: if a run stops halfway, running it
 * again finds the same event and finishes the job.
 */
export async function purgeNonSeedEvents(): Promise<PurgeResult> {
  const snap = await getDocs(collection(db, 'events'));
  const events = snap.docs.map((d) => ({ id: d.id, origin: (d.data() as Event).origin }));
  const ids = selectEventsToPurge(events, SEED_EVENTS.map((e) => e.slug));
  const result: PurgeResult = { events: 0, participants: 0, comments: 0, helpers: 0 };

  for (const id of ids) {
    for (const sub of ['participants', 'comments', 'helpers'] as const) {
      const docs = (await getDocs(collection(db, 'events', id, sub))).docs.map((d) => d.ref);
      await deleteAll(docs);
      result[sub] += docs.length;
    }
    await deleteDoc(doc(db, 'events', id));
    result.events++;
  }
  return result;
}

// ---------------------------------------------------------------- admins

export async function grantAdmin(targetUid: string, role: AdminRole, label: string, grantedBy: string) {
  await setDoc(doc(db, 'admins', targetUid), {
    role,
    label: label.trim(),
    grantedBy,
    grantedAt: serverTimestamp(),
  });
}

export async function revokeAdmin(targetUid: string) {
  await deleteDoc(doc(db, 'admins', targetUid));
}
