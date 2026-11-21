import { deleteDoc, doc, getDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { currentUser, db } from '../lib/firebase';
import { deleteMyContact, forgetIdentity, restoreIdentity } from './identity';
import { leaveEvent, withdrawHelperInterest } from './firebaseService';
import { deletePublicProfile } from './profileService';

export interface DeletionReport {
  interestsWithdrawn: number;
  helperOffersWithdrawn: number;
  draftsDeleted: number;
  /** Proposals already sent for review: only an admin can remove them (email request). */
  sentProposalsKept: number;
}

/**
 * "Delete my data": withdraws every interest and helper offer (the public counts go down with
 * them), hides initials, deletes unsent drafts, the public profile, contact details and the
 * users/{uid} document, then deletes this anonymous account itself. Each step uses the same
 * rule-checked writes as the app, so nobody else's records are touched.
 *
 * What stays, because the rules make it write-only or admin-only: proposals already sent for
 * review, anonymous suggestions and space offers, analytics events and view markers. They carry
 * the old random uid only, which no longer belongs to any account afterwards.
 */
export async function deleteAllMyData(eventIds: string[]): Promise<DeletionReport> {
  const report: DeletionReport = { interestsWithdrawn: 0, helperOffersWithdrawn: 0, draftsDeleted: 0, sentProposalsKept: 0 };
  // Never creates an ID: a browser without one has nothing stored with us.
  const user = currentUser() ?? (await restoreIdentity());
  if (!user) {
    forgetIdentity();
    return report;
  }
  const uid = user.uid;
  const meSnap = await getDoc(doc(db, 'users', uid));
  const me = meSnap.data() ?? {};

  for (const eventId of eventIds) {
    // Leaving also removes the shown initial (see leaveEvent).
    const joined = await getDoc(doc(db, 'events', eventId, 'participants', uid));
    if (joined.exists() && (await leaveEvent(eventId, uid))) report.interestsWithdrawn++;
    if (await withdrawHelperInterest(eventId, uid)) report.helperOffersWithdrawn++;
  }

  const mine = await getDocs(query(collection(db, 'proposals'), where('uid', '==', uid)));
  for (const p of mine.docs) {
    if (p.data().status === 'draft') {
      await deleteDoc(p.ref);
      report.draftsDeleted++;
    } else {
      report.sentProposalsKept++;
    }
  }

  // An organiser application (pending, approved or declined) goes too.
  try {
    await deleteDoc(doc(db, 'organiserApplications', uid));
  } catch (err) {
    console.warn('organiser application', err);
  }
  if (typeof me.publicId === 'string') await deletePublicProfile(me.publicId);
  await deleteMyContact();
  if (meSnap.exists()) await deleteDoc(doc(db, 'users', uid));

  // Last: the anonymous account. The next visit starts with a new random id.
  const last = currentUser();
  if (last) await deleteUser(last);
  // And what this browser kept: the ID marker, settings and answers.
  forgetIdentity();
  return report;
}
