import {
  collection,
  collectionGroup,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AdminDoc, AdminRole, Event, EventStatus, ParticipantDoc } from '../types';

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
