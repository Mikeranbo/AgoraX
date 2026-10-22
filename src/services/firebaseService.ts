import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  collectionGroup,
  doc,
  onSnapshot,
  orderBy,
  getDocs,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  setDoc,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ensureAnonymousAuth, getSource, linkContact } from './identity';
import { Event, EventCategory, Venue, UserDoc, PriceAnswer, RanBefore, SpaceType } from '../types';
import { splitContact } from '../data/forms';
import { SEED_EVENTS } from '../data/seedEvents';

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

function handleFirestoreError(error: any, operationType: string, path: string | null): never {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Events ---

/** Milliseconds for a Firestore Timestamp, a date string, or nothing (older documents). */
export function timestampMillis(value: any): number {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

const SEED_ORDER = new Map(SEED_EVENTS.map((e, i) => [e.slug, i]));

/**
 * Newest first. Documents without createdAt sort last instead of vanishing (a Firestore
 * orderBy would silently drop them). The seed batch shares one timestamp, so ties fall
 * back to the order the seed list is written in — which keeps categories grouped.
 */
export function sortEvents(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    const byTime = timestampMillis(b.createdAt) - timestampMillis(a.createdAt);
    if (byTime !== 0) return byTime;
    const ai = SEED_ORDER.get(a.slug ?? a.id) ?? Number.MAX_SAFE_INTEGER;
    const bi = SEED_ORDER.get(b.slug ?? b.id) ?? Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.title.localeCompare(b.title);
  });
}

export const subscribeToEvents = (callback: (events: Event[]) => void, onError?: (error: Error) => void) => {
  return onSnapshot(collection(db, 'events'), (snapshot) => {
    const events = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data({ serverTimestamps: 'estimate' })
    })) as Event[];
    callback(sortEvents(events));
  }, (error) => {
    console.error('Events listener failed', error);
    onError?.(error);
  });
};

export interface JoinMeta {
  priceSeen: number;
  source: string;
}

/**
 * Idempotent: the counters only move when the participant document did not already exist,
 * so joining twice (double tap, two tabs, retry) can never inflate the count. The read and
 * the writes share one transaction, so two racing joins can't both see "not joined yet".
 * Returns true if this call created the join.
 */
export const joinEvent = async (eventId: string, userId: string, meta: JoinMeta): Promise<boolean> => {
  const eventRef = doc(db, 'events', eventId);
  const participantRef = doc(db, 'events', eventId, 'participants', userId);
  const userRef = doc(db, 'users', userId);
  try {
    return await runTransaction(db, async (tx) => {
      const existing = await tx.get(participantRef);
      if (existing.exists()) {
        // Heal the mirror on users/{uid} if it ever fell out of step, but count nothing.
        tx.set(userRef, { uid: userId, joinedEvents: arrayUnion(eventId) }, { merge: true });
        return false;
      }
      tx.set(participantRef, {
        joinedAt: serverTimestamp(),
        priceSeen: meta.priceSeen,
        source: meta.source,
      });
      tx.update(eventRef, { participantsCount: increment(1), joins: increment(1) });
      tx.set(
        userRef,
        { uid: userId, lastSeenAt: serverTimestamp(), joinedEvents: arrayUnion(eventId) },
        { merge: true },
      );
      return true;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `events/${eventId}/participants/${userId}`);
  }
};

/** Mirror of joinEvent: only decrements if the participant document existed. */
export const leaveEvent = async (eventId: string, userId: string): Promise<boolean> => {
  const eventRef = doc(db, 'events', eventId);
  const participantRef = doc(db, 'events', eventId, 'participants', userId);
  const userRef = doc(db, 'users', userId);
  try {
    return await runTransaction(db, async (tx) => {
      const existing = await tx.get(participantRef);
      if (!existing.exists()) {
        tx.set(userRef, { uid: userId, joinedEvents: arrayRemove(eventId) }, { merge: true });
        return false;
      }
      tx.delete(participantRef);
      // Leaving also takes the person's initial off the list, if they showed it.
      tx.delete(doc(db, 'events', eventId, 'faces', userId));
      tx.update(eventRef, { participantsCount: increment(-1), joins: increment(-1) });
      tx.set(userRef, { uid: userId, joinedEvents: arrayRemove(eventId) }, { merge: true });
      return true;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `events/${eventId}/participants/${userId}`);
  }
};

/** A joiner who chose to show their initial on an event's list. */
export interface Face {
  eventId: string;
  uid: string;
  initial: string;
}

/** Every shown initial, in one listener, grouped by event id. */
export const subscribeToFaces = (callback: (faces: Map<string, Face[]>) => void) =>
  onSnapshot(
    collectionGroup(db, 'faces'),
    (snap) => {
      const byEvent = new Map<string, Face[]>();
      snap.docs.forEach((d) => {
        const eventId = d.ref.parent.parent?.id ?? '';
        const list = byEvent.get(eventId) ?? [];
        list.push({ eventId, uid: d.id, initial: String(d.data().initial ?? '') });
        byEvent.set(eventId, list);
      });
      callback(byEvent);
    },
    (error) => console.warn('Faces listener failed', error),
  );

/** Opt-in: show this person's first initial on one event they joined. */
export const showMyInitial = (eventId: string, userId: string, initial: string) =>
  setDoc(doc(db, 'events', eventId, 'faces', userId), { initial, ts: serverTimestamp() });

export const hideMyInitial = (eventId: string, userId: string) => deleteDoc(doc(db, 'events', eventId, 'faces', userId));

/** Cheap aggregate counters on the event document, so the admin page never scans analytics. */
export const bumpEventCounter = async (eventId: string, field: 'impressions' | 'opens') => {
  try {
    await ensureAnonymousAuth();
    await updateDoc(doc(db, 'events', eventId), { [field]: increment(1) });
  } catch (error) {
    // Analytics must never surface as an error to the visitor.
    console.warn(`${field} counter failed`, error);
  }
};

export interface HelperInput {
  firstName: string;
  phone: string;
  email: string;
  ranBefore: RanBefore;
}

/**
 * "I'd help run this", saved against the event at events/{eventId}/helpers/{uid}. The
 * organiserInterest counter moves only the first time this person offers for this event;
 * sending again just updates the answer. Contact details go to users/{uid} only.
 * Returns true if this was a new offer.
 */
export const submitHelperInterest = async (eventId: string, userId: string, v: HelperInput): Promise<boolean> => {
  const eventRef = doc(db, 'events', eventId);
  const helperRef = doc(db, 'events', eventId, 'helpers', userId);
  let created = false;
  try {
    created = await runTransaction(db, async (tx) => {
      const existing = await tx.get(helperRef);
      tx.set(helperRef, { ranBefore: v.ranBefore, ts: serverTimestamp() });
      if (existing.exists()) return false;
      tx.update(eventRef, { organiserInterest: increment(1) });
      return true;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `events/${eventId}/helpers/${userId}`);
  }
  await linkContact({
    name: v.firstName,
    phone: v.phone,
    email: v.email,
    purpose: 'organising',
    wantsToOrganise: true,
  });
  return created;
};

export const recordPriceAnswer = async (
  userId: string,
  eventId: string,
  priceSeen: number,
  priceAsked: number,
  answer: PriceAnswer,
) => {
  try {
    await setDoc(
      doc(db, 'users', userId),
      { uid: userId, priceAnswers: { [eventId]: { answer, priceAsked, priceSeen, ts: serverTimestamp() } } },
      { merge: true },
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
};

/** Live copy of the visitor's own users/{uid} document (joins, answers, contact flag). */
export const subscribeToMyUser = (userId: string, callback: (user: UserDoc | null) => void) => {
  return onSnapshot(doc(db, 'users', userId), (snap) => {
    callback(snap.exists() ? (snap.data() as UserDoc) : null);
  }, (error) => {
    console.warn('users listener failed', error);
    callback(null);
  });
};

// --- Suggestions & venue offers (create-only collections) ---

/** Anonymous by design: no contact field, so no consent is needed (anyone who wants a reply uses Propose). */
export const submitSuggestion = async (input: { text: string }) => {
  const user = await ensureAnonymousAuth();
  try {
    await addDoc(collection(db, 'suggestions'), {
      uid: user.uid,
      text: input.text.trim(),
      source: getSource(),
      ts: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'suggestions');
  }
};

export interface ProposalInput {
  title: string;
  category: EventCategory;
  price: number;
  minPeople: number;
  needs: string;
  firstName: string;
  phone: string;
}

/**
 * A student's event idea. Stored without contact details (those go to users/{uid} under the
 * 'proposal' consent); it stays out of the feed until an admin approves it.
 */
export const submitProposal = async (input: ProposalInput) => {
  const user = await ensureAnonymousAuth();
  try {
    await addDoc(collection(db, 'proposals'), {
      uid: user.uid,
      title: input.title.trim(),
      category: input.category,
      price: input.price,
      minPeople: input.minPeople,
      needs: input.needs.trim(),
      status: 'new',
      source: getSource(),
      ts: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'proposals');
  }
  await linkContact({ name: input.firstName, phone: input.phone, purpose: 'proposal' });
};

export interface VenueOfferInput {
  name: string;
  spaceType: SpaceType;
  capacity: number;
  contact: string;
}

/**
 * "I have a space". The offer records only the type and size of the space; the person's name
 * and WhatsApp/email go to users/{uid} under the 'space' consent, so erasure covers them.
 */
export const submitVenueOffer = async (input: VenueOfferInput) => {
  const user = await ensureAnonymousAuth();
  try {
    await addDoc(collection(db, 'venueOffers'), {
      uid: user.uid,
      spaceType: input.spaceType,
      capacity: input.capacity,
      source: getSource(),
      ts: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'venueOffers');
  }
  const { email, phone } = splitContact(input.contact);
  await linkContact({ name: input.name, email, phone, purpose: 'space', hasSpace: true });
};

// --- Seeding ---

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Writes the 33 seed events to events/{slug}. Safe to re-run:
 *  - existing events get their *content* refreshed (title, copy, price, costs, emoji…);
 *  - counters, status, images, dates and createdAt are only set when the event is new, so a
 *    re-seed never wipes real signups or an admin's manual status/photo changes.
 */
export const seedEvents = async (): Promise<{ created: number; updated: number }> => {
  try {
    const existing = new Set((await getDocs(collection(db, 'events'))).docs.map((d) => d.id));
    const batch = writeBatch(db);
    let created = 0;
    let updated = 0;
    const now = Date.now();

    for (const s of SEED_EVENTS) {
      const ref = doc(db, 'events', s.slug);
      const content = {
        slug: s.slug,
        title: s.title,
        description: s.description,
        category: s.category,
        price: s.price,
        minParticipants: s.minParticipants,
        durationHours: s.durationHours,
        hostsNeeded: s.hostsNeeded,
        fixedCost: s.fixedCost,
        perPersonCost: s.perPersonCost,
        bringYourOwn: s.bringYourOwn,
        venueNote: s.venueNote,
        season: s.season,
        emoji: s.emoji,
        accent: s.accent,
      };
      if (existing.has(s.slug)) {
        batch.set(ref, content, { merge: true });
        updated++;
      } else {
        batch.set(
          ref,
          {
            ...content,
            status: 'Pending',
            organizerId: 'agorax',
            imageUrls: [],
            deadline: new Date(now + 21 * DAY_MS).toISOString(),
            startTime: new Date(now + 28 * DAY_MS).toISOString(),
            createdAt: serverTimestamp(),
            participantsCount: 0,
            impressions: 0,
            opens: 0,
            joins: 0,
            organiserInterest: 0,
          },
          { merge: true },
        );
        created++;
      }
    }
    await batch.commit();
    return { created, updated };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'events');
  }
};

// --- Venues (not reachable from the public build, kept for later) ---

export const subscribeToVenues = (callback: (venues: Venue[]) => void) => {
  return onSnapshot(collection(db, 'venues'), (snapshot) => {
    const venues = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Venue[];
    callback(venues);
  }, (error) => {
    console.warn('Venues listener failed', error);
  });
};

export const createVenue = async (venue: Omit<Venue, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'venues'), venue);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'venues');
  }
};
