import { initializeApp } from 'firebase/app';
import {
  Auth,
  browserLocalPersistence,
  browserSessionPersistence,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  initializeAuth,
  User,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * VITE_FIREBASE_EMULATORS=1 (browser tests only) points the app at the local emulators under a
 * demo- project id, so a test run can never read or write the real project.
 */
const useEmulators = import.meta.env.VITE_FIREBASE_EMULATORS === '1';

export const app = initializeApp(useEmulators ? { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-agorax' } : firebaseConfig);

/**
 * Nothing may be stored on the visitor's device before their first action (Telecommunicatiewet
 * 11.7a, privacy notice 1.1 section 2). The Firebase SDK keeps a usage "heartbeat" in IndexedDB
 * (firebase-heartbeat-database) as soon as Firestore or Auth starts. It only reports SDK versions
 * to Google and the app does not need it, so it is switched off before any service starts.
 */
function switchOffHeartbeat() {
  try {
    const provider = (app as any).container?.getProvider?.('heartbeat');
    if (provider && !provider.isInitialized?.()) provider.component = null;
  } catch {
    /* an SDK change: the storage check in e2e/storage.spec.ts will show it */
  }
}
switchOffHeartbeat();

// Memory cache only (the default): Firestore keeps nothing in the browser.
export const db = getFirestore(app, useEmulators ? '(default)' : firebaseConfig.firestoreDatabaseId);
if (useEmulators) connectFirestoreEmulator(db, '127.0.0.1', 8080);

let authInstance: Auth | null = null;

/**
 * Auth starts only when it is needed: on the visitor's first action, or on load for a browser
 * that already has an ID from an earlier visit. Starting it writes its persistence check to
 * IndexedDB, so it must never run just because the page opened.
 */
export function getAuthLazy(): Auth {
  if (!authInstance) {
    // The same storage order as getAuth(), without the popup/redirect helper (the app never uses it).
    authInstance = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence] });
    if (useEmulators) connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true });
  }
  return authInstance;
}

/** The signed-in user if Auth has already started; never starts it. */
export function currentUser(): User | null {
  return authInstance?.currentUser ?? null;
}
