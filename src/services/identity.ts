import { signInAnonymously, linkWithCredential, AuthCredential, User } from 'firebase/auth';
import { deleteDoc, deleteField, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { once } from './session';
import { acceptReferrer, resolveSource, shareCodeFor } from '../data/share';
import { contactKeyFor, normaliseEmail, normalisePhone } from '../data/contact';
import { CONSENT_VERSION, ConsentPurpose } from '../data/consent';

/**
 * Identity model: nobody signs in. Every visitor is a Firebase *anonymous* user and the
 * uid is the only identity key. Contact details are stored as plain fields on users/{uid},
 * never as the key — so the anonymous account can later be upgraded with
 * linkWithCredential (see upgradeAnonymousAccount) and keep the same uid and all its data.
 */

const UID_KEY = 'agorax_uid';
const SRC_KEY = 'agorax_src';
const REF_KEY = 'agorax_ref';

let authPromise: Promise<User> | null = null;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/** Resolves once a Firebase user exists, signing in anonymously only if there is none. */
export function ensureAnonymousAuth(): Promise<User> {
  if (!authPromise) {
    authPromise = (async () => {
      // currentUser is null until Firebase has restored the persisted session; signing in
      // before this resolves would mint a brand-new uid on every page load.
      await auth.authStateReady();
      const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
      await reconcileStoredUid(user);
      return user;
    })().catch((err) => {
      authPromise = null;
      throw err;
    });
  }
  return authPromise;
}

/** Turns a sign-in failure into something a person (or the admin) can act on. */
export function describeAuthError(err: any): string {
  if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/admin-restricted-operation') {
    return 'Anonymous sign-in is not enabled for this project yet. Enable it in Firebase Console → Authentication → Sign-in method → Anonymous.';
  }
  return "We couldn't start a session. Check your connection and try again.";
}

export function getUid(): string | null {
  return auth.currentUser?.uid ?? null;
}

function urlParams(): URLSearchParams {
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return new URLSearchParams();
  }
}

/** First-touch attribution: the poster (or 'share') of the first visit, never overwritten. */
export function getSource(): string {
  const stored = safeGet(SRC_KEY);
  const src = resolveSource(urlParams(), stored);
  if (!stored) safeSet(SRC_KEY, src);
  return src;
}

/** First-touch referrer code from a shared link (?ref=), never the visitor's own. */
export function getReferrer(uid: string): string | null {
  const own = shareCodeFor(uid);
  const stored = safeGet(REF_KEY);
  if (stored) return acceptReferrer(stored, own);
  const ref = acceptReferrer(urlParams().get('ref'), own);
  if (ref) safeSet(REF_KEY, ref);
  return ref;
}

/** Secondary check: if the stored uid differs from the one Firebase gave us, flag it for review. */
async function reconcileStoredUid(user: User) {
  const stored = safeGet(UID_KEY);
  if (stored && stored !== user.uid) {
    await writeMergeRequest(user.uid, stored, 'localStorage');
  }
  safeSet(UID_KEY, user.uid);
}

/** Never merged client-side — an admin reviews these. */
async function writeMergeRequest(uid: string, otherUid: string, matchedOn: string) {
  try {
    await setDoc(doc(db, 'mergeRequests', uid), {
      uid,
      otherUid,
      matchedOn,
      ts: serverTimestamp(),
    });
  } catch (err) {
    // Create-only collection: a second attempt for the same uid is denied, which is fine.
    console.warn('mergeRequest not written', err);
  }
}

/** Creates users/{uid} on first sight, otherwise bumps lastSeenAt. Once per session. */
export async function touchUser(): Promise<void> {
  if (!once('touch_user')) return;
  try {
    const user = await ensureAnonymousAuth();
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { lastSeenAt: serverTimestamp() });
    } else {
      await setDoc(ref, {
        uid: user.uid,
        createdAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
        source: getSource(),
        shareCode: shareCodeFor(user.uid),
        referredBy: getReferrer(user.uid),
        hasContact: false,
        joinedEvents: [],
      });
    }
  } catch (err) {
    console.warn('touchUser failed', err);
  }
}

// ---------------------------------------------------------------- contact

export interface ContactInput {
  name?: string;
  email?: string;
  phone?: string;
  /** What this consent is for — recorded separately per purpose, never bundled. */
  purpose: ConsentPurpose;
  wantsToOrganise?: boolean;
  hasSpace?: boolean;
}

export { normaliseEmail, normalisePhone };

/**
 * Security rules stop one visitor from reading another's users document, so duplicates can't
 * be found by querying users. Instead every email/phone gets an opaque lookup document
 * (contactKeys/{hash} → { uid }). If the key already belongs to a different uid, we file a
 * mergeRequest for an admin to review.
 */
async function detectDuplicateContact(uid: string, email: string, phone: string) {
  const matches: { kind: 'email' | 'phone'; otherUid: string }[] = [];
  const candidates: { kind: 'email' | 'phone'; value: string }[] = [];
  if (email) candidates.push({ kind: 'email', value: email });
  if (phone) candidates.push({ kind: 'phone', value: phone });

  for (const { kind, value } of candidates) {
    const keyRef = doc(db, 'contactKeys', await contactKeyFor(kind, value));
    const snap = await getDoc(keyRef);
    if (!snap.exists()) {
      await setDoc(keyRef, { uid, kind, ts: serverTimestamp() });
    } else if (snap.data().uid !== uid) {
      matches.push({ kind, otherUid: snap.data().uid as string });
    }
  }

  if (matches.length > 0) {
    const other = matches[0].otherUid;
    const kinds = matches.filter((m) => m.otherUid === other).map((m) => m.kind);
    await writeMergeRequest(uid, other, kinds.join('+'));
  }
  return matches.length > 0;
}

/** Attaches contact details to this visitor's uid. Never merges accounts client-side. */
export async function linkContact(input: ContactInput): Promise<{ possibleDuplicate: boolean }> {
  const user = await ensureAnonymousAuth();
  const email = normaliseEmail(input.email);
  const phone = normalisePhone(input.phone);
  const ref = doc(db, 'users', user.uid);
  const existing = await getDoc(ref);

  const payload: Record<string, unknown> = {
    uid: user.uid,
    lastSeenAt: serverTimestamp(),
    source: getSource(),
    hasContact: true,
    consents: { [input.purpose]: { version: CONSENT_VERSION, at: serverTimestamp() } },
  };
  if (!existing.exists()) payload.createdAt = serverTimestamp();
  if (input.name?.trim()) payload.name = input.name.trim();
  if (email) payload.email = email;
  if (phone) payload.phone = phone;
  if (input.wantsToOrganise) payload.wantsToOrganise = true;
  if (input.hasSpace) payload.hasSpace = true;
  await setDoc(ref, payload, { merge: true });

  let possibleDuplicate = false;
  try {
    possibleDuplicate = await detectDuplicateContact(user.uid, email, phone);
  } catch (err) {
    // The contact itself is saved; duplicate detection is best-effort.
    console.warn('duplicate check failed', err);
  }
  return { possibleDuplicate };
}

/** A private display name for the sidebar and profile. Nobody else sees it. */
export async function saveDisplayName(displayName: string): Promise<void> {
  const user = await ensureAnonymousAuth();
  await setDoc(doc(db, 'users', user.uid), { uid: user.uid, displayName: displayName.trim().slice(0, 40) }, { merge: true });
}

/** Turns one consent purpose on or off (withdrawing consent must be as easy as giving it). */
export async function setConsent(purpose: ConsentPurpose, on: boolean): Promise<void> {
  const user = await ensureAnonymousAuth();
  await updateDoc(doc(db, 'users', user.uid), {
    [`consents.${purpose}`]: on ? { version: CONSENT_VERSION, at: serverTimestamp() } : deleteField(),
  });
}

/**
 * Self-service erasure (GDPR Art. 17): removes every contact detail and consent from
 * users/{uid} and the lookup keys that point at this uid. Joins and price answers stay —
 * without contact details they no longer identify anyone.
 */
export async function deleteMyContact(): Promise<void> {
  const user = await ensureAnonymousAuth();
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const data = snap.data() ?? {};
  const keys: string[] = [];
  if (data.email) keys.push(await contactKeyFor('email', data.email));
  if (data.phone) keys.push(await contactKeyFor('phone', data.phone));
  for (const key of keys) {
    try {
      await deleteDoc(doc(db, 'contactKeys', key));
    } catch (err) {
      // A key owned by someone else (a duplicate) is not ours to delete.
      console.warn('contact key not deleted', err);
    }
  }
  if (snap.exists()) {
    await updateDoc(ref, {
      hasContact: false,
      name: deleteField(),
      email: deleteField(),
      phone: deleteField(),
      consents: deleteField(),
      consent: deleteField(),
      consentAt: deleteField(),
      wantsToOrganise: deleteField(),
      hasSpace: deleteField(),
    });
  }
}

/**
 * Not wired to any UI yet. Linking a credential keeps the same uid, so every join, answer
 * and contact detail already stored under it carries over to the permanent account.
 */
export async function upgradeAnonymousAccount(credential: AuthCredential) {
  if (!auth.currentUser) throw new Error('No current user to upgrade');
  return linkWithCredential(auth.currentUser, credential);
}
