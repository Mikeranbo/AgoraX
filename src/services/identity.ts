import { signInAnonymously, linkWithCredential, AuthCredential, User } from 'firebase/auth';
import { deleteDoc, deleteField, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { once } from './session';
import { acceptReferrer, resolveSource, shareCodeFor } from '../data/share';
import { contactKeyFor, normaliseEmail, normalisePhone } from '../data/contact';
import { CONSENT_VERSION, ConsentPurpose } from '../data/consent';
import { NOTICE_VERSION } from '../config/pilot';

/**
 * Identity model: nobody signs in. Every visitor is a Firebase *anonymous* user and the
 * uid is the only identity key. Contact details are stored as plain fields on users/{uid},
 * never as the key — so the anonymous account can later be upgraded with
 * linkWithCredential (see upgradeAnonymousAccount) and keep the same uid and all its data.
 *
 * Accounts are never linked or flagged as "the same person" from a typed email/phone or a
 * uid the browser reports: neither proves ownership. Linking waits for a verified flow
 * (docs/SECURITY.md).
 */

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
      return auth.currentUser ?? (await signInAnonymously(auth)).user;
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
  /** Optional extra purposes the person ticked themselves (e.g. 'launch'); unticked by default. */
  alsoConsent?: ConsentPurpose[];
  wantsToOrganise?: boolean;
  hasSpace?: boolean;
}

/** What is stored for one consent: wording version, notice version, server time. */
const consentEntry = () => ({ version: CONSENT_VERSION, notice: NOTICE_VERSION, at: serverTimestamp() });

export { normaliseEmail, normalisePhone };

/**
 * Attaches contact details to this visitor's uid. A typed email or phone is never looked up
 * against other visitors and never used to link accounts: it proves nothing about ownership,
 * and the old hash lookup let anyone check whether a given person had signed up.
 */
export async function linkContact(input: ContactInput): Promise<void> {
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
    consents: Object.fromEntries([input.purpose, ...(input.alsoConsent ?? [])].map((p) => [p, consentEntry()])),
  };
  if (!existing.exists()) payload.createdAt = serverTimestamp();
  if (input.name?.trim()) payload.name = input.name.trim();
  if (email) payload.email = email;
  if (phone) payload.phone = phone;
  if (input.wantsToOrganise) payload.wantsToOrganise = true;
  if (input.hasSpace) payload.hasSpace = true;
  await setDoc(ref, payload, { merge: true });
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
    [`consents.${purpose}`]: on ? consentEntry() : deleteField(),
  });
}

/**
 * Self-service erasure (GDPR Art. 17): removes every contact detail and consent from
 * users/{uid} and any lookup keys older versions created for this uid. Joins and price answers stay —
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
