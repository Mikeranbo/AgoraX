import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * VITE_FIREBASE_EMULATORS=1 (browser tests only) points the app at the local emulators under a
 * demo- project id, so a test run can never read or write the real project.
 */
const useEmulators = import.meta.env.VITE_FIREBASE_EMULATORS === '1';

export const app = initializeApp(useEmulators ? { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-agorax' } : firebaseConfig);
export const db = getFirestore(app, useEmulators ? '(default)' : firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

if (useEmulators) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}
