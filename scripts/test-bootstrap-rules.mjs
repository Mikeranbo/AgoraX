// Checks the first-owner bootstrap lock against the Firestore emulator.
// Run: npx firebase-tools emulators:exec --only firestore "node scripts/test-bootstrap-rules.mjs"
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, writeBatch, setDoc, updateDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'agorax-a8d07',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
});

const owner = (uid) => ({ role: 'owner', label: 'Mike (founder)', grantedBy: 'bootstrap', grantedAt: serverTimestamp() });
const claim = (db, uid, role = 'owner') => {
  const b = writeBatch(db);
  b.set(doc(db, 'admins', uid), { ...owner(uid), role });
  b.set(doc(db, 'meta', 'bootstrap'), { claimedBy: uid, ts: serverTimestamp() });
  return b.commit();
};

let failed = 0;
const check = async (name, p) => {
  try { await p; console.log('ok   ', name); } catch (e) { failed++; console.log('FAIL ', name, e.message); }
};

const alice = env.authenticatedContext('alice').firestore();
const bob = env.authenticatedContext('bob').firestore();
const anon = env.unauthenticatedContext().firestore();

await check('signed-out cannot claim', assertFails(claim(anon, 'x')));
await check('admin doc alone (no lock) denied', assertFails(setDoc(doc(alice, 'admins', 'alice'), owner('alice'))));
await check('lock alone (no admin doc) denied', assertFails(setDoc(doc(alice, 'meta', 'bootstrap'), { claimedBy: 'alice', ts: serverTimestamp() })));
await check('claim as editor denied', assertFails(claim(alice, 'alice', 'editor')));
await check('claim for someone else denied', assertFails(claim(alice, 'bob')));
await check('signed-in can see lock is free', assertSucceeds(getDoc(doc(alice, 'meta', 'bootstrap'))));
await check('first claim succeeds', assertSucceeds(claim(alice, 'alice')));
await check('second claim denied', assertFails(claim(bob, 'bob')));
await check('lock cannot be updated', assertFails(updateDoc(doc(alice, 'meta', 'bootstrap'), { claimedBy: 'bob' })));
await check('lock cannot be deleted', assertFails(deleteDoc(doc(alice, 'meta', 'bootstrap'))));
await check('owner can seed an event', assertSucceeds(setDoc(doc(alice, 'events', 'board-games'), { title: 't', description: 'd', category: 'Games', status: 'Pending' })));
await check('owner can still grant admins', assertSucceeds(setDoc(doc(alice, 'admins', 'bob'), { role: 'viewer', label: 'Bob', grantedBy: 'alice', grantedAt: serverTimestamp() })));
await check('viewer cannot promote self', assertFails(updateDoc(doc(bob, 'admins', 'bob'), { role: 'owner' })));

await env.cleanup();
console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
