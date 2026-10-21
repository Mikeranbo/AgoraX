import { signInAnonymously, linkWithCredential, AuthCredential, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { once } from './session';

/**
 * Identity model: nobody signs in. Every visitor is a Firebase *anonymous* user and the
 * uid is the only identity key. Contact details are stored as plain fields on users/{uid},
 * never as the key — so the anonymous account can later be upgraded with
 * linkWithCredential (see upgradeAnonymousAccount) and keep the same uid and all its data.
 */

const UID_KEY = 'agorax_uid';
const SRC_KEY = 'agorax_src';

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

/** First-touch attribution: ?src= is captured on the first visit and never overwritten. */
export function getSource(): string {
  const stored = safeGet(SRC_KEY);
  if (stored) return stored;
  let src = 'direct';
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('src');
    const clean = (fromUrl ?? '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
    if (clean) src = clean;
  } catch {
    /* ignore */
  }
  safeSet(SRC_KEY, src);
  return src;
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
        hasContact: false,
        joinedEvents: [],
        organiserEvents: [],
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
  wantsToOrganise?: boolean;
  hasSpace?: boolean;
}

export function normaliseEmail(raw?: string): string {
  return (raw ?? '').trim().toLowerCase();
}

/** Strips formatting; assumes a Dutch national number (06…) when no country code is given. */
export function normalisePhone(raw?: string): string {
  let p = (raw ?? '').replace(/[\s().-]/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (!p.startsWith('+') && /^0\d{9}$/.test(p)) p = '+31' + p.slice(1);
  return p;
}

async function sha256Hex(input: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(input);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // crypto.subtle only exists on https/localhost; a phone testing over http://192.168.x.x
  // would otherwise fail here. FNV-1a is enough for an opaque, stable document id.
  let h1 = 0x811c9dc5;
  let h2 = 0x1b873593;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0;
  }
  return 'f' + h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

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
    const keyRef = doc(db, 'contactKeys', await sha256Hex(`${kind}:${value}`));
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
    consent: true,
    consentAt: serverTimestamp(),
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

/**
 * Not wired to any UI yet. Linking a credential keeps the same uid, so every join, answer
 * and contact detail already stored under it carries over to the permanent account.
 */
export async function upgradeAnonymousAccount(credential: AuthCredential) {
  if (!auth.currentUser) throw new Error('No current user to upgrade');
  return linkWithCredential(auth.currentUser, credential);
}
