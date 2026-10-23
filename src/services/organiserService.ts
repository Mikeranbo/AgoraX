import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ensureAnonymousAuth, getSource } from './identity';
import type { EventCategory, Proposal } from '../types';

export interface ProposalDraft {
  title: string;
  category: EventCategory;
  price: number;
  minPeople: number;
  needs: string;
  image?: string;
  imageCredit?: string;
}

/** The author's own proposals (drafts, sent, approved, not taken forward). */
export function subscribeMyProposals(uid: string, callback: (items: Proposal[]) => void, onError?: (e: Error) => void) {
  return onSnapshot(
    query(collection(db, 'proposals'), where('uid', '==', uid)),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }) as Proposal)),
    (err) => onError?.(err),
  );
}

/**
 * Creates or updates a proposal as a draft ('draft') or sends it for review ('new'). The rules
 * only let the author change it while it is a draft, and never approve it themselves.
 * Returns the proposal id.
 */
export async function writeProposal(id: string | null, draft: ProposalDraft, status: 'draft' | 'new', organiserPublicId?: string): Promise<string> {
  const user = await ensureAnonymousAuth();
  const ref = id ? doc(db, 'proposals', id) : doc(collection(db, 'proposals'));
  await setDoc(ref, {
    uid: user.uid,
    title: draft.title.trim(),
    category: draft.category,
    price: draft.price,
    minPeople: draft.minPeople,
    needs: draft.needs.trim(),
    ...(draft.image ? { image: draft.image } : {}),
    ...(draft.imageCredit ? { imageCredit: draft.imageCredit } : {}),
    ...(organiserPublicId ? { organiserPublicId } : {}),
    status,
    source: getSource(),
    ts: serverTimestamp(),
  });
  return ref.id;
}

/** Only unsent drafts can be deleted by their author. */
export const deleteDraft = (id: string) => deleteDoc(doc(db, 'proposals', id));
