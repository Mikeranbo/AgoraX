import { signInAnonymously, linkWithCredential, AuthCredential, User } from 'firebase/auth';
import { deleteDoc, deleteField, doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { currentUser, db, getAuthLazy } from '../lib/firebase';
import { once } from './session';
import { acceptReferrer, resolveSource, shareCodeFor } from '../data/share';
import { contactKeyFor, normaliseEmail, normalisePhone } from '../data/contact';
import { CONSENT_VERSION, ConsentPurpose } from '../data/consent';
import { NOTICE_VERSION } from '../config/pilot';

/**
 * Identity model: nobody signs in. A visitor becomes a Firebase *anonymous* user on their
 * first action (tapping Interested, sending a form, ...), never just by opening the page:
 * nothing is stored on the device before that (Telecommunicatiewet 11.7a, notice 1.1 §2).
 * The uid is the only identity key. Contact details are stored as plain fields on users/{uid},
 * never as the key, so the anonymous account can later be upgraded with linkWithCredential
 * and keep the same uid and all its data.
 *
 * Accounts are never linked or flagged as "the same person" from a typed email/phone or a
 * uid the browser reports: neither proves ownership (docs/SECURITY.md).
 */

const SRC_KEY = 'agorax_src';
/** Set when this browser gets its ID, so a later visit knows to restore it. */
const ID_KEY = 'agorax_id';
/** Every key the app itself writes, cleared by "Delete everything". */
export const APP_STORAGE_KEYS = [
  SRC_KEY,
  ID_KEY,
  'agorax_ref',
  'agorax_city',
  'agorax_sidebar',
  'agorax_banner_dismissed',
  'agorax.pilotNotice.hidden',
  'agorax_stats_consent',
  'agorax_no_stats',
  'agorax_counted',
];

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
    /* private mode: the value lasts for this visit */
  }
}

function urlParams(): URLSearchParams {
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return new URLSearchParams();
  }
}

/**
 * First-touch attribution, held in memory until the ID exists: a value stored on an earlier
 * visit wins, else this visit's ?src= (or 'share' / 'direct').
 */
let sessionSource = resolveSource(urlParams(), safeGet(SRC_KEY));
/** A shared link's ?ref=, in memory only; recorded once on users/{uid} when the ID is made. */
const sessionRef = urlParams().get('ref');

export function getSource(): string {
  return sessionSource;
}

/** The users doc keeps the first-touch source; later visits attribute their joins to it. */
export function adoptStoredSource(source: unknown) {
  if (typeof source === 'string' && source) sessionSource = source;
}

// ---------------------------------------------------------------- the ID

const listeners = new Set<(user: User) => void>();

/** Called with the user whenever this browser's ID becomes known (created or restored). */
export function onIdentity(listener: (user: User) => void): () => void {
  listeners.add(listener);
  const user = currentUser();
  if (user && authPromise) listener(user);
  return () => listeners.delete(listener);
}

const announce = (user: User) => listeners.forEach((l) => l(user));

/** The first write of a new ID: who they are and where they came from. */
async function createUserDoc(user: User) {
  const own = shareCodeFor(user.uid);
  await setDoc(
    doc(db, 'users', user.uid),
    {
      uid: user.uid,
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      source: sessionSource,
      shareCode: own,
      referredBy: acceptReferrer(sessionRef, own),
      hasContact: false,
    },
    { merge: true },
  );
}

/**
 * The ID for this browser, created now if there is none. Call it only from something the
 * visitor did. The users doc is written before this resolves, so later writes never race it.
 */
export function ensureAnonymousAuth(): Promise<User> {
  if (!authPromise) {
    authPromise = (async () => {
      const auth = getAuthLazy();
      // currentUser is null until Firebase has restored a persisted session; signing in
      // before this resolves would mint a brand-new uid.
      await auth.authStateReady();
      let user = auth.currentUser;
      if (!user) {
        user = (await signInAnonymously(auth)).user;
        safeSet(ID_KEY, '1');
        if (!safeGet(SRC_KEY)) safeSet(SRC_KEY, sessionSource);
        try {
          await createUserDoc(user);
        } catch (err) {
          console.warn('users doc not created', err);
        }
      }
      announce(user);
      return user;
    })().catch((err) => {
      authPromise = null;
      throw err;
    });
  }
  return authPromise;
}

/** Whether this browser already got an ID on an earlier visit. Reads only; creates nothing. */
async function hadIdentityBefore(): Promise<boolean> {
  // agorax_src was written on page load by builds before 21 Nov 2026, so it marks those visitors too.
  if (safeGet(ID_KEY) || safeGet(SRC_KEY)) return true;
  try {
    for (let i = 0; i < localStorage.length; i++) if (localStorage.key(i)?.startsWith('firebase:authUser:')) return true;
  } catch {
    /* no storage */
  }
  try {
    const list = await indexedDB.databases?.();
    return !!list?.some((d) => d.name === 'firebaseLocalStorageDb');
  } catch {
    return false;
  }
}

/**
 * On page load: brings back the ID of a returning visitor, so their picks show. For a first
 * visit it does nothing at all (Auth is not even started). Resolves to the user or null.
 */
export async function restoreIdentity(): Promise<User | null> {
  if (authPromise) return authPromise.catch(() => null);
  if (!(await hadIdentityBefore())) return null;
  try {
    const auth = getAuthLazy();
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) return null;
    if (!authPromise) authPromise = Promise.resolve(user);
    if (!safeGet(ID_KEY)) safeSet(ID_KEY, '1');
    announce(user);
    void touchUser(user);
    return user;
  } catch (err) {
    console.warn('identity not restored', err);
    return null;
  }
}

/** After "Delete everything": the next action starts a new, empty ID. */
export function forgetIdentity() {
  authPromise = null;
  for (const key of APP_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

/** Describes a sign-in failure in words a person (or the admin) can act on. */
export function describeAuthError(err: any): string {
  if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/admin-restricted-operation') {
    return 'Anonymous sign-in is not enabled for this project yet. Enable it in Firebase Console → Authentication → Sign-in method → Anonymous.';
  }
  return "We couldn't start a session. Check your connection and try again.";
}

export function getUid(): string | null {
  return currentUser()?.uid ?? null;
}

/** A returning visitor: bumps lastSeenAt once per page load (creates the doc if it went missing). */
async function touchUser(user: User): Promise<void> {
  if (!once('touch_user')) return;
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      adoptStoredSource(snap.data().source);
      await updateDoc(ref, { lastSeenAt: serverTimestamp() });
    } else {
      await createUserDoc(user);
    }
  } catch (err) {
    console.warn('touchUser failed', err);
  }
}

/**
 * The anonymous visit count: +1 on visits/{source} per page load, with no ID and nothing stored
 * on the device. The rules accept exactly +1 and nothing else.
 */
export function countVisit(): void {
  if (!once('visit')) return;
  const src = resolveSource(urlParams(), null);
  setDoc(doc(db, 'visits', src), { count: increment(1) }, { merge: true }).catch((err) => console.warn('visit not counted', err));
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
    hasContact: true,
    consents: Object.fromEntries([input.purpose, ...(input.alsoConsent ?? [])].map((p) => [p, consentEntry()])),
  };
  if (!existing.exists()) {
    payload.createdAt = serverTimestamp();
    payload.source = sessionSource;
  }
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

/** The fields "delete my contact details" removes, here and in the admin's "Delete all contact data". */
export const CONTACT_FIELDS = ['name', 'email', 'phone', 'consents', 'consent', 'consentAt', 'wantsToOrganise', 'hasSpace'] as const;

export const contactWipe = () => ({
  hasContact: false,
  ...Object.fromEntries(CONTACT_FIELDS.map((f) => [f, deleteField()])),
});

/**
 * Self-service erasure (GDPR Art. 17): removes every contact detail and consent from
 * users/{uid} and any lookup keys older versions created for this uid. Joins and price answers
 * stay — without contact details they no longer identify anyone. Never creates an ID: with no
 * ID there is nothing to delete.
 */
export async function deleteMyContact(): Promise<void> {
  const user = currentUser() ?? (await restoreIdentity());
  if (!user) return;
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
  if (snap.exists()) await updateDoc(ref, contactWipe());
}

/**
 * Not wired to any UI yet. Linking a credential keeps the same uid, so every join, answer
 * and contact detail already stored under it carries over to the permanent account.
 */
export async function upgradeAnonymousAccount(credential: AuthCredential) {
  const user = currentUser();
  if (!user) throw new Error('No current user to upgrade');
  return linkWithCredential(user, credential);
}
