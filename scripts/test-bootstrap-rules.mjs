// Checks the first-owner bootstrap lock and the opt-in initials against the Firestore emulator.
// Run: npx firebase-tools emulators:exec --only firestore "node scripts/test-bootstrap-rules.mjs"
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, writeBatch, setDoc, updateDoc, deleteDoc, getDoc, getDocs, addDoc, collection, collectionGroup, query, where, serverTimestamp } from 'firebase/firestore';

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

const face = (db, uid, initial = 'M') => setDoc(doc(db, 'events', 'board-games', 'faces', uid), { initial, ts: serverTimestamp() });
await check('non-joiner cannot show an initial', assertFails(face(alice, 'alice')));
await check('joining works', assertSucceeds(setDoc(doc(alice, 'events', 'board-games', 'participants', 'alice'), { joinedAt: serverTimestamp(), priceSeen: 5, source: 'test' })));
await check('joiner can show an initial', assertSucceeds(face(alice, 'alice')));
await check('two letters denied', assertFails(face(alice, 'alice', 'MS')));
await check('cannot show an initial for someone else', assertFails(face(bob, 'alice')));
await check('anyone signed in can read initials', assertSucceeds(getDocs(collectionGroup(bob, 'faces'))));
await check('signed-out cannot read initials', assertFails(getDocs(collectionGroup(anon, 'faces'))));
await check('joiner can hide it again', assertSucceeds(deleteDoc(doc(alice, 'events', 'board-games', 'faces', 'alice'))));

await check('display name up to 40 chars', assertSucceeds(setDoc(doc(bob, 'users', 'bob'), { uid: 'bob', displayName: 'B'.repeat(40) }, { merge: true })));
await check('display name over 40 denied', assertFails(setDoc(doc(bob, 'users', 'bob'), { displayName: 'B'.repeat(41) }, { merge: true })));
const proposal = (extra) => ({ uid: 'bob', title: 'Salsa night', category: 'Social', price: 5, minPeople: 10, needs: '', status: 'new', source: 'test', ts: serverTimestamp(), ...extra });
await check('proposal without photo', assertSucceeds(addDoc(collection(bob, 'proposals'), proposal({}))));
await check('proposal with photo link', assertSucceeds(addDoc(collection(bob, 'proposals'), proposal({ image: 'https://example.com/a.jpg' }))));
await check('proposal with uploaded photo', assertSucceeds(addDoc(collection(bob, 'proposals'), proposal({ image: 'data:image/jpeg;base64,' + 'A'.repeat(150000), imageCredit: 'Photo: X, CC BY' }))));
await check('proposal with http photo denied', assertFails(addDoc(collection(bob, 'proposals'), proposal({ image: 'http://example.com/a.jpg' }))));
await check('proposal photo over 200k denied', assertFails(addDoc(collection(bob, 'proposals'), proposal({ image: 'data:image/jpeg;base64,' + 'A'.repeat(200001) }))));
await check('visitor can vote for a feature', assertSucceeds(addDoc(collection(bob, 'analytics'), { uid: 'bob', name: 'feature_vote', payload: { feature: 'map' }, source: 'test', ts: serverTimestamp() })));
await check('owner can read feature votes', assertSucceeds(getDocs(query(collection(alice, 'analytics'), where('name', 'in', ['locked_feature_click', 'feature_vote'])))));
await check('visitor cannot read feature votes', assertFails(getDocs(query(collection(env.authenticatedContext('carol').firestore(), 'analytics'), where('name', 'in', ['feature_vote'])))));

await env.cleanup();
console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
