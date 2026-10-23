// Checks firestore.rules against the Firestore emulator. Every write here goes straight
// through the SDK, the way a script that skips the UI would. Run: npm run test:rules
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, writeBatch, setDoc, updateDoc, deleteDoc, getDoc, getDocs, addDoc, collection, collectionGroup,
  query, where, serverTimestamp, increment, deleteField, arrayUnion,
} from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-agorax',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
});

let failed = 0;
const check = async (name, p) => {
  try { await p; console.log('ok   ', name); } catch (e) { failed++; console.log('FAIL ', name, e.message); }
};
const expectEqual = async (name, actual, expected) => {
  const a = await actual;
  if (a === expected) console.log('ok   ', name);
  else { failed++; console.log('FAIL ', name, `expected ${expected}, got ${a}`); }
};

// Admins are provisioned outside the app (console / Admin SDK), so the tests seed them the same way.
const event = (extra = {}) => ({
  title: 't', description: 'd', category: 'Games', status: 'Pending',
  participantsCount: 0, joins: 0, impressions: 0, opens: 0, organiserInterest: 0, ...extra,
});
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'admins', 'alice'), { role: 'owner', label: 'Owner', grantedBy: 'console' });
  await setDoc(doc(db, 'admins', 'erin'), { role: 'editor', label: 'Editor', grantedBy: 'alice' });
  await setDoc(doc(db, 'admins', 'vic'), { role: 'viewer', label: 'Viewer', grantedBy: 'alice' });
  for (const id of ['board-games', 'loop', 'helpers', 'views', 'mixed']) await setDoc(doc(db, 'events', id), event());
  // A counter that drifted below its real participant docs (possible under the old rules).
  await setDoc(doc(db, 'events', 'drifted'), event());
  await setDoc(doc(db, 'events', 'drifted', 'participants', 'dave'), { joinedAt: new Date(), priceSeen: 5, source: 'old' });
  await setDoc(doc(db, 'contactKeys', 'k-bob'), { uid: 'bob', kind: 'email' });
  // A users doc written by an older client with a field shape the new checks would reject.
  await setDoc(doc(db, 'users', 'legacy'), { uid: 'legacy', source: 12345, consent: true, joinedEvents: [] });
  await setDoc(doc(db, 'users', 'zoe'), { uid: 'zoe', name: 'Zoe', email: 'zoe@example.com', hasContact: true });
});

const as = (uid) => env.authenticatedContext(uid).firestore();
const alice = as('alice'); // owner
const erin = as('erin'); // editor
const vic = as('vic'); // viewer
const bob = as('bob'); // visitor
const mallory = as('mallory'); // visitor running a script
const anon = env.unauthenticatedContext().firestore();

const readEvent = async (id, field) => {
  let v;
  await env.withSecurityRulesDisabled(async (ctx) => { v = (await getDoc(doc(ctx.firestore(), 'events', id))).data()?.[field]; });
  return v;
};
const countDocs = async (path) => {
  let n;
  await env.withSecurityRulesDisabled(async (ctx) => { n = (await getDocs(collection(ctx.firestore(), ...path))).size; });
  return n;
};

// ------------------------------------------------------------------ owner bootstrap (attack 1)
const claim = (db, uid) => {
  const b = writeBatch(db);
  b.set(doc(db, 'admins', uid), { role: 'owner', label: 'x', grantedBy: 'bootstrap', grantedAt: serverTimestamp() });
  b.set(doc(db, 'meta', 'bootstrap'), { claimedBy: uid, ts: serverTimestamp() });
  return b.commit();
};
await check('visitor cannot claim the owner seat (bootstrap batch)', assertFails(claim(mallory, 'mallory')));
await check('signed-out cannot claim', assertFails(claim(anon, 'x')));
await check('visitor cannot create their own admin doc', assertFails(setDoc(doc(mallory, 'admins', 'mallory'), { role: 'owner', label: 'x', grantedBy: 'mallory', grantedAt: serverTimestamp() })));
await check('visitor cannot write meta/bootstrap', assertFails(setDoc(doc(mallory, 'meta', 'bootstrap'), { claimedBy: 'mallory', ts: serverTimestamp() })));
await check('visitor cannot read meta/bootstrap', assertFails(getDoc(doc(mallory, 'meta', 'bootstrap'))));

// ------------------------------------------------------------------ admin listing (attack 4)
await check('visitor cannot list admins', assertFails(getDocs(collection(mallory, 'admins'))));
await check('visitor cannot read another admin doc', assertFails(getDoc(doc(mallory, 'admins', 'alice'))));
await check('visitor can check their own (missing) admin doc', assertSucceeds(getDoc(doc(bob, 'admins', 'bob'))));
await check('viewer can read own admin doc', assertSucceeds(getDoc(doc(vic, 'admins', 'vic'))));
await check('viewer cannot list admins', assertFails(getDocs(collection(vic, 'admins'))));
await check('editor cannot list admins', assertFails(getDocs(collection(erin, 'admins'))));
await check('owner can list admins', assertSucceeds(getDocs(collection(alice, 'admins'))));

const grant = (role, extra = {}) => ({ role, label: 'Carol', grantedBy: 'alice', grantedAt: serverTimestamp(), ...extra });
await check('owner can grant a viewer', assertSucceeds(setDoc(doc(alice, 'admins', 'carol'), grant('viewer'))));
await check('owner can change a role', assertSucceeds(setDoc(doc(alice, 'admins', 'carol'), grant('editor'))));
await check('grant with unknown role denied', assertFails(setDoc(doc(alice, 'admins', 'carol'), grant('god'))));
await check('grant with extra fields denied', assertFails(setDoc(doc(alice, 'admins', 'carol'), grant('viewer', { email: 'x@y.z' }))));
await check('grant naming someone else as granter denied', assertFails(setDoc(doc(alice, 'admins', 'carol'), grant('viewer', { grantedBy: 'erin' }))));
await check('owner cannot edit their own admin doc', assertFails(setDoc(doc(alice, 'admins', 'alice'), grant('viewer', { grantedBy: 'alice' }))));
await check('owner cannot revoke themselves', assertFails(deleteDoc(doc(alice, 'admins', 'alice'))));
await check('editor cannot grant admins', assertFails(setDoc(doc(erin, 'admins', 'dan'), grant('viewer', { grantedBy: 'erin' }))));
await check('viewer cannot promote self', assertFails(updateDoc(doc(vic, 'admins', 'vic'), { role: 'owner' })));
await check('owner can revoke another admin', assertSucceeds(deleteDoc(doc(alice, 'admins', 'carol'))));
await check('owner can seed an event', assertSucceeds(setDoc(doc(alice, 'events', 'seeded'), event())));

// ------------------------------------------------------------------ contact access
await check('visitor cannot read another users doc', assertFails(getDoc(doc(mallory, 'users', 'zoe'))));
await check('visitor cannot list users', assertFails(getDocs(collection(mallory, 'users'))));
await check('viewer cannot read contact details', assertFails(getDoc(doc(vic, 'users', 'zoe'))));
await check('viewer cannot list users', assertFails(getDocs(collection(vic, 'users'))));
await check('editor can list users', assertSucceeds(getDocs(collection(erin, 'users'))));
await check('owner can list users', assertSucceeds(getDocs(collection(alice, 'users'))));

// ------------------------------------------------------------------ contact keys + merges (attack 3)
await check('visitor cannot look up a contact hash', assertFails(getDoc(doc(mallory, 'contactKeys', 'k-bob'))));
await check('visitor cannot list contact hashes', assertFails(getDocs(collection(mallory, 'contactKeys'))));
await check('visitor cannot claim a contact hash', assertFails(setDoc(doc(mallory, 'contactKeys', 'k-victim'), { uid: 'mallory', kind: 'email', ts: serverTimestamp() })));
await check('someone else cannot delete a contact key', assertFails(deleteDoc(doc(mallory, 'contactKeys', 'k-bob'))));
await check('key owner can still erase their old contact key', assertSucceeds(deleteDoc(doc(bob, 'contactKeys', 'k-bob'))));
await check('visitor cannot file a merge request', assertFails(setDoc(doc(mallory, 'mergeRequests', 'mallory'), { uid: 'mallory', otherUid: 'victim', matchedOn: 'email', ts: serverTimestamp() })));

// ------------------------------------------------------------------ users doc shape (attack 5)
const touch = (uid, extra = {}) => ({
  uid, createdAt: serverTimestamp(), lastSeenAt: serverTimestamp(), source: 'poster-a',
  shareCode: uid.slice(0, 8), referredBy: null, hasContact: false, joinedEvents: [], ...extra,
});
await check('first visit creates users doc', assertSucceeds(setDoc(doc(bob, 'users', 'bob'), touch('bob'))));
await check('return visit bumps lastSeenAt', assertSucceeds(updateDoc(doc(bob, 'users', 'bob'), { lastSeenAt: serverTimestamp() })));
await check('first visit with a valid referrer', assertSucceeds(setDoc(doc(as('ref1'), 'users', 'ref1'), touch('ref1', { referredBy: 'abcd1234' }))));
await check('referrer cannot be changed later', assertFails(updateDoc(doc(as('ref1'), 'users', 'ref1'), { referredBy: 'zzzz9999' })));
await check('referrer cannot be added after the first visit', assertFails(updateDoc(doc(bob, 'users', 'bob'), { referredBy: 'abcd1234' })));
await check('malformed referrer denied', assertFails(setDoc(doc(as('ref2'), 'users', 'ref2'), touch('ref2', { referredBy: 'x'.repeat(500) }))));
await check('own share code as referrer denied', assertFails(setDoc(doc(as('ref3abcd'), 'users', 'ref3abcd'), touch('ref3abcd', { referredBy: 'ref3abcd' }))));
await check('forged share code denied', assertFails(setDoc(doc(mallory, 'users', 'mallory'), touch('mallory', { shareCode: 'abcd1234' }))));
await check('share code cannot be changed', assertFails(updateDoc(doc(bob, 'users', 'bob'), { shareCode: 'zzzz9999' })));
await check('uid field must match the doc', assertFails(setDoc(doc(mallory, 'users', 'mallory'), touch('mallory', { uid: 'zoe' }))));
await check('join mirror creates a users doc', assertSucceeds(setDoc(doc(as('newbie'), 'users', 'newbie'), { uid: 'newbie', lastSeenAt: serverTimestamp(), joinedEvents: arrayUnion('board-games') }, { merge: true })));
await check('joinedEvents must be a list', assertFails(updateDoc(doc(bob, 'users', 'bob'), { joinedEvents: 'all' })));
await check('fake createdAt denied', assertFails(updateDoc(doc(bob, 'users', 'bob'), { createdAt: new Date(0) })));
await check('unknown field denied', assertFails(updateDoc(doc(bob, 'users', 'bob'), { isAdmin: true })));

const contact = (purpose, extra = {}) => ({
  uid: 'bob', lastSeenAt: serverTimestamp(), source: 'poster-a', hasContact: true,
  consents: { [purpose]: { version: 'v1', at: serverTimestamp() } }, ...extra,
});
await check('contact details save (banner)', assertSucceeds(setDoc(doc(bob, 'users', 'bob'), contact('updates', { email: 'bob@example.com', phone: '+31612345678' }), { merge: true })));
await check('contact details save (organiser)', assertSucceeds(setDoc(doc(bob, 'users', 'bob'), contact('organising', { name: 'Bob', wantsToOrganise: true }), { merge: true })));
await check('unknown consent purpose denied', assertFails(setDoc(doc(bob, 'users', 'bob'), contact('marketing'), { merge: true })));
await check('consent without a server timestamp denied', assertFails(setDoc(doc(bob, 'users', 'bob'), { consents: { space: { version: 'v1', at: new Date(0) } } }, { merge: true })));
await check('name over 80 denied', assertFails(updateDoc(doc(bob, 'users', 'bob'), { name: 'B'.repeat(81) })));
await check('email must be a string', assertFails(updateDoc(doc(bob, 'users', 'bob'), { email: ['a@b.c'] })));
await check('consent can be withdrawn', assertSucceeds(updateDoc(doc(bob, 'users', 'bob'), { 'consents.updates': deleteField() })));
await check('display name up to 40 chars', assertSucceeds(setDoc(doc(bob, 'users', 'bob'), { uid: 'bob', displayName: 'B'.repeat(40) }, { merge: true })));
await check('display name over 40 denied', assertFails(setDoc(doc(bob, 'users', 'bob'), { displayName: 'B'.repeat(41) }, { merge: true })));
const answer = (extra = {}, ev = 'board-games', declared = ev) => ({ uid: 'bob', lastPriceAnswer: declared, priceAnswers: { [ev]: { answer: 'yes', priceAsked: 6, priceSeen: 5, ts: serverTimestamp(), ...extra } } });
await check('price answer saves', assertSucceeds(setDoc(doc(bob, 'users', 'bob'), answer(), { merge: true })));
await check('second price answer saves', assertSucceeds(setDoc(doc(bob, 'users', 'bob'), answer({ answer: 'no' }, 'loop'), { merge: true })));
await check('changing the same answer again saves', assertSucceeds(setDoc(doc(bob, 'users', 'bob'), answer({ answer: 'depends' }, 'loop'), { merge: true })));
await check('price answer for an undeclared event denied', assertFails(setDoc(doc(bob, 'users', 'bob'), answer({}, 'helpers', 'loop'), { merge: true })));
await check('price answer with unknown value denied', assertFails(setDoc(doc(bob, 'users', 'bob'), answer({ answer: 'maybe' }), { merge: true })));
await check('price answer with extra payload denied', assertFails(setDoc(doc(bob, 'users', 'bob'), answer({ blob: 'x'.repeat(1000) }), { merge: true })));
await check('erasure removes contact details', assertSucceeds(updateDoc(doc(bob, 'users', 'bob'), {
  hasContact: false, name: deleteField(), email: deleteField(), phone: deleteField(), consents: deleteField(),
  consent: deleteField(), consentAt: deleteField(), wantsToOrganise: deleteField(), hasSpace: deleteField(),
})));
await check('older users doc can still be updated', assertSucceeds(updateDoc(doc(as('legacy'), 'users', 'legacy'), { lastSeenAt: serverTimestamp() })));
await check('older users doc can drop a legacy field', assertSucceeds(updateDoc(doc(as('legacy'), 'users', 'legacy'), { consent: deleteField() })));
await check('legacy consent field cannot be set again', assertFails(updateDoc(doc(as('legacy'), 'users', 'legacy'), { consent: true })));

// ------------------------------------------------------------------ participation counters (attack 2)
const pRef = (db, ev, uid) => doc(db, 'events', ev, 'participants', uid);
const joinBatch = (db, ev, uid, step = 1) => {
  const b = writeBatch(db);
  b.set(pRef(db, ev, uid), { joinedAt: serverTimestamp(), priceSeen: 5, source: 'test' });
  if (step) b.update(doc(db, 'events', ev), { participantsCount: increment(step), joins: increment(step) });
  return b.commit();
};
const leaveBatch = (db, ev, uid, step = -1) => {
  const b = writeBatch(db);
  b.delete(pRef(db, ev, uid));
  if (step) b.update(doc(db, 'events', ev), { participantsCount: increment(step), joins: increment(step) });
  return b.commit();
};
await check('join counts once', assertSucceeds(joinBatch(bob, 'board-games', 'bob')));
await expectEqual('count is 1 after join', readEvent('board-games', 'participantsCount'), 1);
await check('joining again is denied', assertFails(joinBatch(bob, 'board-games', 'bob')));
await check('participant doc cannot be rewritten', assertFails(setDoc(pRef(bob, 'board-games', 'bob'), { joinedAt: serverTimestamp(), priceSeen: 1, source: 'x' })));
await check('leaving without lowering the count denied', assertFails(leaveBatch(bob, 'board-games', 'bob', 0)));
await check('leave lowers the count', assertSucceeds(leaveBatch(bob, 'board-games', 'bob')));
await check('rejoin counts once', assertSucceeds(joinBatch(bob, 'board-games', 'bob')));
await expectEqual('count is 1 after leave + rejoin', readEvent('board-games', 'participantsCount'), 1);
await check('participant doc without counter denied', assertFails(joinBatch(mallory, 'board-games', 'mallory', 0)));
await check('counter +1 without participant doc denied', assertFails(updateDoc(doc(mallory, 'events', 'board-games'), { participantsCount: increment(1), joins: increment(1) })));
await check('counter +2 with one participant denied', assertFails(joinBatch(mallory, 'board-games', 'mallory', 2)));
await check('joins must move with participantsCount', assertFails((() => {
  const b = writeBatch(mallory);
  b.set(pRef(mallory, 'board-games', 'mallory'), { joinedAt: serverTimestamp(), priceSeen: 5, source: 'test' });
  b.update(doc(mallory, 'events', 'board-games'), { participantsCount: increment(1), joins: increment(5) });
  return b.commit();
})()));
await check('cannot join for someone else', assertFails(joinBatch(mallory, 'board-games', 'bob2')));
await check('cannot join an event that does not exist', assertFails(joinBatch(mallory, 'no-such-event', 'mallory')));
await check('priceSeen must be a sane number', assertFails((() => {
  const b = writeBatch(mallory);
  b.set(pRef(mallory, 'board-games', 'mallory'), { joinedAt: serverTimestamp(), priceSeen: 1e9, source: 'test' });
  b.update(doc(mallory, 'events', 'board-games'), { participantsCount: increment(1), joins: increment(1) });
  return b.commit();
})()));

// The confirmed attack: join, leave without decrementing, repeat.
for (let i = 0; i < 5; i++) {
  await joinBatch(mallory, 'loop', 'mallory').catch(() => {});
  await leaveBatch(mallory, 'loop', 'mallory', 0).catch(() => {});
}
await expectEqual('join/leave loop: count equals real participants', readEvent('loop', 'participantsCount'), await countDocs(['events', 'loop', 'participants']));
await expectEqual('join/leave loop: joins equals real participants', readEvent('loop', 'joins'), await countDocs(['events', 'loop', 'participants']));

await check('drifted counter: leave at 0 without decrement', assertSucceeds(leaveBatch(as('dave'), 'drifted', 'dave', 0)));
await expectEqual('drifted counter stays at 0', readEvent('drifted', 'participantsCount'), 0);
await check('setup: eve joins the drifted event', assertSucceeds(joinBatch(as('eve'), 'drifted', 'eve')));
await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), 'events', 'drifted'), { participantsCount: 0, joins: 0 }));
await check('counter cannot go below 0', assertFails(leaveBatch(as('eve'), 'drifted', 'eve')));

// ------------------------------------------------------------------ organiser interest (attack 2b)
const hRef = (db, ev, uid) => doc(db, 'events', ev, 'helpers', uid);
const offer = (db, ev, uid, step = 1) => {
  const b = writeBatch(db);
  b.set(hRef(db, ev, uid), { ranBefore: 'yes', ts: serverTimestamp() });
  if (step) b.update(doc(db, 'events', ev), { organiserInterest: increment(step) });
  return b.commit();
};
await check('helper offer counts once', assertSucceeds(offer(bob, 'helpers', 'bob')));
await check('resubmitting the offer does not count', assertSucceeds(offer(bob, 'helpers', 'bob', 0)));
await check('resubmitting cannot add to the count', assertFails(offer(bob, 'helpers', 'bob')));
await check('helper doc without counter denied', assertFails(offer(mallory, 'helpers', 'mallory', 0)));
await check('withdrawing without lowering the count denied', assertFails(deleteDoc(hRef(bob, 'helpers', 'bob'))));
for (let i = 0; i < 5; i++) {
  await offer(mallory, 'helpers', 'mallory').catch(() => {});
  await deleteDoc(hRef(mallory, 'helpers', 'mallory')).catch(() => {});
}
await expectEqual('helper loop: interest equals real helpers', readEvent('helpers', 'organiserInterest'), await countDocs(['events', 'helpers', 'helpers']));

// ------------------------------------------------------------------ view counters stay analytics
const seenRef = (db, ev, uid) => doc(db, 'events', ev, 'seen', uid);
const view = (db, ev, uid, field = 'impressions', extra = {}) => {
  const b = writeBatch(db);
  b.set(seenRef(db, ev, uid), { [field]: serverTimestamp() }, { merge: true });
  b.update(doc(db, 'events', ev), { [field]: increment(1), ...extra });
  return b.commit();
};
await check('first impression counts', assertSucceeds(view(bob, 'views', 'bob')));
await check('second impression from the same visitor denied', assertFails(view(bob, 'views', 'bob')));
await check('first open counts', assertSucceeds(view(bob, 'views', 'bob', 'opens')));
for (let i = 0; i < 20; i++) await updateDoc(doc(mallory, 'events', 'views'), { impressions: increment(1) }).catch(() => {});
await expectEqual('impression loop without marker does not count', readEvent('views', 'impressions'), 1);
await check('marker for someone else denied', assertFails(view(mallory, 'views', 'bob2')));
await check('view bump cannot carry a participation change', assertFails(view(mallory, 'mixed', 'mallory', 'impressions', { participantsCount: increment(1), joins: increment(1) })));
await check('join cannot carry a view bump', assertFails((() => {
  const b = writeBatch(mallory);
  b.set(pRef(mallory, 'mixed', 'mallory'), { joinedAt: serverTimestamp(), priceSeen: 5, source: 'test' });
  b.update(doc(mallory, 'events', 'mixed'), { participantsCount: increment(1), joins: increment(1), impressions: increment(1) });
  return b.commit();
})()));
await check('visitor cannot read view markers', assertFails(getDoc(seenRef(bob, 'views', 'bob'))));

// ------------------------------------------------------------------ initials (unchanged flow)
const face = (db, uid, initial = 'M') => setDoc(doc(db, 'events', 'board-games', 'faces', uid), { initial, ts: serverTimestamp() });
await check('non-joiner cannot show an initial', assertFails(face(alice, 'alice')));
await check('joiner can show an initial', assertSucceeds(face(bob, 'bob', 'B')));
await check('two letters denied', assertFails(face(bob, 'bob', 'BB')));
await check('cannot show an initial for someone else', assertFails(face(mallory, 'bob')));
await check('anyone signed in can read initials', assertSucceeds(getDocs(collectionGroup(mallory, 'faces'))));
await check('signed-out cannot read initials', assertFails(getDocs(collectionGroup(anon, 'faces'))));
await check('leave also removes the initial', assertSucceeds((() => {
  const b = writeBatch(bob);
  b.delete(pRef(bob, 'board-games', 'bob'));
  b.delete(doc(bob, 'events', 'board-games', 'faces', 'bob'));
  b.update(doc(bob, 'events', 'board-games'), { participantsCount: increment(-1), joins: increment(-1) });
  return b.commit();
})()));

// ------------------------------------------------------------------ admin reads + purge
await check('viewer can read participants (no contact data)', assertSucceeds(getDocs(collectionGroup(vic, 'participants'))));
await check('visitor cannot read all participants', assertFails(getDocs(collectionGroup(mallory, 'participants'))));
await check('editor can purge a participant', assertSucceeds(deleteDoc(pRef(erin, 'loop', 'mallory'))));
await check('editor can purge a helper', assertSucceeds(deleteDoc(hRef(erin, 'helpers', 'bob'))));
await check('editor can recount an event', assertSucceeds(updateDoc(doc(erin, 'events', 'loop'), { participantsCount: 0, joins: 0, organiserInterest: 0 })));
await check('viewer cannot recount an event', assertFails(updateDoc(doc(vic, 'events', 'loop'), { participantsCount: 7, joins: 7 })));
await check('editor can delete an event', assertSucceeds(deleteDoc(doc(erin, 'events', 'seeded'))));

// ------------------------------------------------------------------ proposals (unchanged flow)
const proposal = (extra) => ({ uid: 'bob', title: 'Salsa night', category: 'Social', price: 5, minPeople: 10, needs: '', status: 'new', source: 'test', ts: serverTimestamp(), ...extra });
await check('proposal without photo', assertSucceeds(addDoc(collection(bob, 'proposals'), proposal({}))));
await check('proposal with photo link', assertSucceeds(addDoc(collection(bob, 'proposals'), proposal({ image: 'https://example.com/a.jpg' }))));
await check('proposal with uploaded photo', assertSucceeds(addDoc(collection(bob, 'proposals'), proposal({ image: 'data:image/jpeg;base64,' + 'A'.repeat(150000), imageCredit: 'Photo: X, CC BY' }))));
await check('proposal with http photo denied', assertFails(addDoc(collection(bob, 'proposals'), proposal({ image: 'http://example.com/a.jpg' }))));
await check('proposal photo over 200k denied', assertFails(addDoc(collection(bob, 'proposals'), proposal({ image: 'data:image/jpeg;base64,' + 'A'.repeat(200001) }))));
await check('proposal for someone else denied', assertFails(addDoc(collection(mallory, 'proposals'), proposal({}))));

// ------------------------------------------------------------------ analytics (attack 5)
const track = (name, payload, extra = {}) => addDoc(collection(bob, 'analytics'), { uid: 'bob', name, payload, source: 'test', ts: serverTimestamp(), ...extra });
await check('visitor can vote for a feature', assertSucceeds(track('feature_vote', { feature: 'map' })));
await check('price ladder event saves', assertSucceeds(track('price_ladder_answer', { eventId: 'board-games', answer: 'yes', priceAsked: 6, priceSeen: 5 })));
await check('contact submit event saves', assertSucceeds(track('contact_submit', { via: 'banner', hasPhone: true, hasEmail: false })));
await check('page view event saves', assertSucceeds(track('page_view', { path: '/' })));
await check('analytics with extra top-level field denied', assertFails(track('page_view', {}, { blob: 'x'.repeat(100000) })));
await check('analytics with unknown payload key denied', assertFails(track('page_view', { email: 'a@b.c' })));
await check('analytics with oversized payload value denied', assertFails(track('page_view', { path: 'x'.repeat(5000) })));
await check('analytics with unknown event name denied', assertFails(track('anything', {})));
await check('analytics for someone else denied', assertFails(addDoc(collection(mallory, 'analytics'), { uid: 'bob', name: 'page_view', payload: {}, source: 'x', ts: serverTimestamp() })));
await check('owner can read feature votes', assertSucceeds(getDocs(query(collection(alice, 'analytics'), where('name', 'in', ['locked_feature_click', 'feature_vote'])))));
await check('visitor cannot read feature votes', assertFails(getDocs(query(collection(mallory, 'analytics'), where('name', 'in', ['feature_vote'])))));

// ------------------------------------------------------------------ private settings on users/{uid}
await check('Attend / Organise / Both choice saves', assertSucceeds(updateDoc(doc(bob, 'users', 'bob'), { mode: 'both' })));
await check('unknown mode denied', assertFails(updateDoc(doc(bob, 'users', 'bob'), { mode: 'admin' })));
await check('saved events save', assertSucceeds(updateDoc(doc(bob, 'users', 'bob'), { savedEvents: arrayUnion('board-games') })));
await check('saved events must be a list', assertFails(updateDoc(doc(bob, 'users', 'bob'), { savedEvents: 'board-games' })));
await check('timing preference saves', assertSucceeds(updateDoc(doc(bob, 'users', 'bob'), { preferredTiming: 'weekend' })));
await check('unknown timing denied', assertFails(updateDoc(doc(bob, 'users', 'bob'), { preferredTiming: 'tomorrow 9pm' })));
const optIn = (purpose) => ({ consents: { [purpose]: { version: 'v2', notice: 'draft-2026-10', at: serverTimestamp() } } });
await check('launch news opt-in saves with notice version', assertSucceeds(setDoc(doc(bob, 'users', 'bob'), optIn('launch'), { merge: true })));
await check('invitations opt-in saves', assertSucceeds(setDoc(doc(bob, 'users', 'bob'), optIn('invites'), { merge: true })));
await check('launch news opt-out', assertSucceeds(updateDoc(doc(bob, 'users', 'bob'), { 'consents.launch': deleteField() })));
await check('consent with a long notice id denied', assertFails(setDoc(doc(bob, 'users', 'bob'), { consents: { invites: { version: 'v2', notice: 'x'.repeat(41), at: serverTimestamp() } } }, { merge: true })));

// ------------------------------------------------------------------ public profiles (never keyed by uid)
const pidBob = 'BobPublicId000000001';
const pidZoe = 'ZoePublicId000000001';
const profile = (extra = {}) => ({ displayName: 'Bob', bio: 'Board games and bouldering', interests: 'Games, Sports', area: 'Groningen', coverY: 40, updatedAt: serverTimestamp(), ...extra });
const claimProfile = (db, uid, pid, data = profile()) => {
  const b = writeBatch(db);
  b.set(doc(db, 'profileOwners', pid), { uid });
  b.set(doc(db, 'profiles', pid), data);
  b.set(doc(db, 'users', uid), { uid, publicId: pid }, { merge: true });
  return b.commit();
};
await check('claim a public id and create a profile', assertSucceeds(claimProfile(bob, 'bob', pidBob)));
await check('public id cannot be claimed twice', assertFails(setDoc(doc(mallory, 'profileOwners', pidBob), { uid: 'mallory' })));
await check('claim for someone else denied', assertFails(setDoc(doc(mallory, 'profileOwners', pidZoe), { uid: 'zoe' })));
await check('malformed public id denied', assertFails(setDoc(doc(mallory, 'profileOwners', 'short'), { uid: 'mallory' })));
await check('nobody can read who owns a public id', assertFails(getDoc(doc(bob, 'profileOwners', pidBob))));
await check('profile without a claim denied', assertFails(setDoc(doc(mallory, 'profiles', 'MalloryNoClaim000001'), profile())));
await check('someone else cannot edit the profile', assertFails(setDoc(doc(mallory, 'profiles', pidBob), profile({ displayName: 'Hacked' }))));
await check('users.publicId must be claimed by that user', assertFails(updateDoc(doc(mallory, 'users', 'mallory'), { publicId: pidBob })));
await check('users.publicId cannot be changed', assertFails(updateDoc(doc(bob, 'users', 'bob'), { publicId: pidZoe })));
await check('signed-in visitors can read a profile', assertSucceeds(getDoc(doc(mallory, 'profiles', pidBob))));
await check('signed-out cannot read a profile', assertFails(getDoc(doc(anon, 'profiles', pidBob))));
await check('visitors cannot list profiles', assertFails(getDocs(collection(mallory, 'profiles'))));
await check('profile cannot carry contact details', assertFails(setDoc(doc(bob, 'profiles', pidBob), profile({ email: 'bob@example.com' }))));
await check('profile cannot claim verification', assertFails(setDoc(doc(bob, 'profiles', pidBob), profile({ verified: true }))));
await check('profile cannot carry the uid', assertFails(setDoc(doc(bob, 'profiles', pidBob), profile({ uid: 'bob' }))));
const jpeg = (n) => 'data:image/jpeg;base64,' + 'A'.repeat(n);
await check('avatar and cover photos save', assertSucceeds(setDoc(doc(bob, 'profiles', pidBob), profile({ avatar: jpeg(30000), cover: jpeg(150000) }))));
await check('SVG avatar denied', assertFails(setDoc(doc(bob, 'profiles', pidBob), profile({ avatar: 'data:image/svg+xml;base64,PHN2Zz4=' }))));
await check('photo link denied (uploads only)', assertFails(setDoc(doc(bob, 'profiles', pidBob), profile({ avatar: 'https://example.com/a.jpg' }))));
await check('oversized avatar denied', assertFails(setDoc(doc(bob, 'profiles', pidBob), profile({ avatar: jpeg(70000) }))));
await check('oversized cover denied', assertFails(setDoc(doc(bob, 'profiles', pidBob), profile({ cover: jpeg(210000) }))));
await check('cover position out of range denied', assertFails(setDoc(doc(bob, 'profiles', pidBob), profile({ coverY: 140 }))));
await check('organiser identity saves', assertSucceeds(setDoc(doc(bob, 'profiles', pidBob), profile({ organiser: { enabled: true, kind: 'organisation', name: 'Groningen Board Gamers', about: 'A student group.' } }))));
await check('organiser with unknown kind denied', assertFails(setDoc(doc(bob, 'profiles', pidBob), profile({ organiser: { enabled: true, kind: 'company', name: 'X', about: '' } }))));
await check('organiser cannot claim registration', assertFails(setDoc(doc(bob, 'profiles', pidBob), profile({ organiser: { enabled: true, kind: 'individual', name: 'X', about: '', registered: true } }))));
await check('display name is required', assertFails(setDoc(doc(bob, 'profiles', pidBob), profile({ displayName: '' }))));
await check('someone else cannot delete the profile', assertFails(deleteDoc(doc(mallory, 'profiles', pidBob))));
await check('owner deletes profile, public id and link in one go', assertSucceeds((() => {
  const b = writeBatch(bob);
  b.delete(doc(bob, 'profiles', pidBob));
  b.delete(doc(bob, 'profileOwners', pidBob));
  b.update(doc(bob, 'users', 'bob'), { publicId: deleteField() });
  return b.commit();
})()));
await check('a new public id can be claimed after deleting', assertSucceeds(claimProfile(bob, 'bob', 'BobPublicId000000002')));

// ------------------------------------------------------------------ organiser drafts (own proposals)
const pidCara = 'CaraPublicId00000001';
const cara = as('cara');
await check('setup: cara claims a public id', assertSucceeds(claimProfile(cara, 'cara', pidCara, profile({ displayName: 'Cara', organiser: { enabled: true, kind: 'individual', name: 'Cara', about: '' } }))));
const draft = (extra = {}) => ({ uid: 'cara', title: 'Pottery evening', category: 'Creative', price: 12, minPeople: 8, needs: '', status: 'draft', source: 'test', ts: serverTimestamp(), ...extra });
const draftRef = doc(cara, 'proposals', 'cara-draft-1');
await check('organiser saves a draft', assertSucceeds(setDoc(draftRef, draft({ organiserPublicId: pidCara }))));
await check('organiser reads their own proposal', assertSucceeds(getDoc(draftRef)));
await check('organiser lists their own proposals', assertSucceeds(getDocs(query(collection(cara, 'proposals'), where('uid', '==', 'cara')))));
await check('organiser cannot list all proposals', assertFails(getDocs(collection(cara, 'proposals'))));
await check('someone else cannot read the draft', assertFails(getDoc(doc(mallory, 'proposals', 'cara-draft-1'))));
await check('someone else cannot edit the draft', assertFails(setDoc(doc(mallory, 'proposals', 'cara-draft-1'), draft({ uid: 'mallory' }))));
await check('draft naming someone else\'s profile denied', assertFails(setDoc(doc(cara, 'proposals', 'cara-draft-2'), draft({ organiserPublicId: pidZoe }))));
await check('organiser edits the draft', assertSucceeds(setDoc(draftRef, draft({ title: 'Pottery night', organiserPublicId: pidCara }))));
await check('draft cannot be approved by its author', assertFails(setDoc(draftRef, draft({ status: 'approved' }))));
await check('organiser submits the draft', assertSucceeds(setDoc(draftRef, draft({ title: 'Pottery night', status: 'new', organiserPublicId: pidCara }))));
await check('submitted proposal is locked for its author', assertFails(setDoc(draftRef, draft({ title: 'Changed', status: 'new' }))));
await check('submitted proposal cannot be deleted by its author', assertFails(deleteDoc(draftRef)));
await check('editor approves the proposal', assertSucceeds(updateDoc(doc(erin, 'proposals', 'cara-draft-1'), { status: 'approved', eventId: 'board-games' })));
await check('organiser deletes an unsent draft', assertSucceeds((async () => {
  await setDoc(doc(cara, 'proposals', 'cara-draft-3'), draft());
  await deleteDoc(doc(cara, 'proposals', 'cara-draft-3'));
})()));

// ------------------------------------------------------------------ suggestions + space offers (unchanged flow)
await check('suggestion saves', assertSucceeds(addDoc(collection(bob, 'suggestions'), { uid: 'bob', text: 'More chess', source: 'test', ts: serverTimestamp() })));
await check('space offer saves', assertSucceeds(addDoc(collection(bob, 'venueOffers'), { uid: 'bob', spaceType: 'room', capacity: 20, source: 'test', ts: serverTimestamp() })));

await env.cleanup();
console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
