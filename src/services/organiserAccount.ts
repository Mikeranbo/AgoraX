import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ensureAnonymousAuth, getSource, linkContact } from './identity';
import { eventFromProposal } from '../data/proposals';
import type { OrganiserApplication, OrganiserStatus, Proposal } from '../types';
import type { ProposalInput } from './firebaseService';

/**
 * Organiser accounts. Anyone can apply with a short plan; an admin editor approves or declines.
 * The answer lives only in organiserApplications/{uid}.status, which the rules let no applicant
 * set. Approved organisers get a badge and can put their own events live without review.
 */

export const PLAN_MIN = 10;
export const PLAN_MAX = 500;

export async function applyToOrganise(plan: string): Promise<void> {
  const user = await ensureAnonymousAuth();
  await setDoc(doc(db, 'organiserApplications', user.uid), { plan: plan.trim(), status: 'pending', ts: serverTimestamp() });
}

/** Withdraw (or clear a "no" before applying again). */
export async function withdrawApplication(): Promise<void> {
  const user = await ensureAnonymousAuth();
  await deleteDoc(doc(db, 'organiserApplications', user.uid));
}

/** The visitor's own application: none, pending, approved or rejected. */
export function subscribeMyApplication(uid: string, onStatus: (s: OrganiserStatus) => void): () => void {
  return onSnapshot(
    doc(db, 'organiserApplications', uid),
    (snap) => onStatus(snap.exists() ? ((snap.data().status as OrganiserStatus) ?? 'pending') : 'none'),
    (err) => {
      console.warn('organiser application', err);
      onStatus('none');
    },
  );
}

/**
 * An approved organiser's own event, live at once: the proposal (status 'approved') and the
 * pending event it becomes are written together. No date; counters start at zero.
 */
export async function publishOwnEvent(input: ProposalInput): Promise<string> {
  const user = await ensureAnonymousAuth();
  const proposalRef = input.draftId ? doc(db, 'proposals', input.draftId) : doc(collection(db, 'proposals'));
  const eventRef = doc(collection(db, 'events'));
  const proposal: Omit<Proposal, 'id' | 'ts'> = {
    uid: user.uid,
    title: input.title.trim(),
    category: input.category,
    price: input.price,
    minPeople: input.minPeople,
    needs: input.needs.trim(),
    ...(input.image ? { image: input.image } : {}),
    ...(input.imageCredit ? { imageCredit: input.imageCredit } : {}),
    ...(input.organiserPublicId ? { organiserPublicId: input.organiserPublicId } : {}),
    status: 'approved',
    eventId: eventRef.id,
    source: getSource(),
  };
  const batch = writeBatch(db);
  batch.set(proposalRef, { ...proposal, ts: serverTimestamp() });
  batch.set(eventRef, {
    ...eventFromProposal({ ...proposal, id: proposalRef.id }, Date.now()),
    organizerId: 'organiser',
    byApprovedOrganiser: true,
    createdAt: serverTimestamp(),
    participantsCount: 0,
    impressions: 0,
    opens: 0,
    joins: 0,
    organiserInterest: 0,
  });
  await batch.commit();
  await linkContact({ name: input.firstName, phone: input.phone, email: input.email, purpose: 'proposal' });
  return eventRef.id;
}

// --- Admin ---

export function subscribeApplications(onList: (list: OrganiserApplication[]) => void, onError: (e: unknown) => void): () => void {
  return onSnapshot(
    query(collection(db, 'organiserApplications'), orderBy('ts', 'desc')),
    (snap) => onList(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<OrganiserApplication, 'uid'>) }))),
    onError,
  );
}

export async function decideApplication(uid: string, status: 'approved' | 'rejected' | 'pending'): Promise<void> {
  const me = await ensureAnonymousAuth();
  await updateDoc(doc(db, 'organiserApplications', uid), { status, decidedAt: serverTimestamp(), decidedBy: me.uid });
}
