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
await check('editor cannot list users (contact details are owner only)', assertFails(getDocs(collection(erin, 'users'))));
await check('editor cannot read a users doc', assertFails(getDoc(doc(erin, 'users', 'zoe'))));
await check('owner can list users', assertSucceeds(getDocs(collection(alice, 'users'))));
await check('owner can read a users doc', assertSucceeds(getDoc(doc(alice, 'users', 'zoe'))));

// ------------------------------------------------------------------ no ID before the first action
await check('signed-out can read the events', assertSucceeds(getDocs(collection(anon, 'events'))));
await check('signed-out can read one event', assertSucceeds(getDoc(doc(anon, 'events', 'board-games'))));
await check('signed-out cannot change an event', assertFails(updateDoc(doc(anon, 'events', 'board-games'), { title: 'x' })));
await check('signed-out cannot move a counter', assertFails(updateDoc(doc(anon, 'events', 'board-games'), { participantsCount: increment(1), joins: increment(1) })));
await check('signed-out cannot read users', assertFails(getDocs(collection(anon, 'users'))));

// ------------------------------------------------------------------ anonymous visit count
const visit = (db, src) => setDoc(doc(db, 'visits', src), { count: increment(1) }, { merge: true });
await check('signed-out visit creates the count', assertSucceeds(visit(anon, 'poster-a')));
await check('signed-out visit adds one', assertSucceeds(visit(anon, 'poster-a')));
await expectEqual('two visits count 2', (async () => {
  let n;
  await env.withSecurityRulesDisabled(async (ctx) => { n = (await getDoc(doc(ctx.firestore(), 'visits', 'poster-a'))).data()?.count; });
  return n;
})(), 2);
await check('signed-in visit adds one too', assertSucceeds(visit(bob, 'poster-a')));
await check('count cannot jump', assertFails(setDoc(doc(anon, 'visits', 'poster-a'), { count: increment(5) }, { merge: true })));
await check('count cannot go down', assertFails(setDoc(doc(anon, 'visits', 'poster-a'), { count: increment(-1) }, { merge: true })));
await check('count cannot be set', assertFails(setDoc(doc(anon, 'visits', 'poster-a'), { count: 1000 })));
await check('new count must start at 1', assertFails(setDoc(doc(anon, 'visits', 'poster-b'), { count: 7 })));
await check('visit cannot carry an ID or anything else', assertFails(setDoc(doc(anon, 'visits', 'poster-c'), { count: 1, uid: 'bob' })));
await check('visit id must be a clean source', assertFails(visit(anon, 'Poster A!')));
await check('visit count cannot be deleted', assertFails(deleteDoc(doc(anon, 'visits', 'poster-a'))));
await check('signed-out cannot read visit counts', assertFails(getDoc(doc(anon, 'visits', 'poster-a'))));
await check('visitor cannot read visit counts', assertFails(getDocs(collection(bob, 'visits'))));
await check('viewer can read visit counts', assertSucceeds(getDocs(collection(vic, 'visits'))));

// ------------------------------------------------------------------ owner deletes all contact data
await check('editor cannot wipe contact details', assertFails(updateDoc(doc(erin, 'users', 'zoe'), { hasContact: false, name: deleteField(), email: deleteField() })));
await check('owner cannot change someone\'s email', assertFails(updateDoc(doc(alice, 'users', 'zoe'), { email: 'other@example.com' })));
await check('owner cannot touch other fields while wiping', assertFails(updateDoc(doc(alice, 'users', 'zoe'), { hasContact: false, email: deleteField(), joinedEvents: [] })));
await check('owner wipes contact details', assertSucceeds(updateDoc(doc(alice, 'users', 'zoe'), { hasContact: false, name: deleteField(), email: deleteField(), phone: deleteField(), consents: deleteField() })));
await expectEqual('wiped email is gone', (async () => {
  let v;
  await env.withSecurityRulesDisabled(async (ctx) => { v = (await getDoc(doc(ctx.firestore(), 'users', 'zoe'))).data()?.email; });
  return v;
})(), undefined);

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
await check('signed-out can read initials (shown on public events)', assertSucceeds(getDocs(collectionGroup(anon, 'faces'))));
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
await check('signed-out can read a public profile by id', assertSucceeds(getDoc(doc(anon, 'profiles', pidBob))));
await check('signed-out cannot list profiles', assertFails(getDocs(collection(anon, 'profiles'))));
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
await check('editor cannot read proposals', assertFails(getDoc(doc(erin, 'proposals', 'cara-draft-1'))));
await check('editor cannot approve a proposal', assertFails(updateDoc(doc(erin, 'proposals', 'cara-draft-1'), { status: 'approved', eventId: 'board-games' })));
await check('owner approves the proposal', assertSucceeds(updateDoc(doc(alice, 'proposals', 'cara-draft-1'), { status: 'approved', eventId: 'board-games' })));
await check('organiser deletes an unsent draft', assertSucceeds((async () => {
  await setDoc(doc(cara, 'proposals', 'cara-draft-3'), draft());
  await deleteDoc(doc(cara, 'proposals', 'cara-draft-3'));
})()));

// ------------------------------------------------------------------ organiser accounts: apply, approve, publish
const appRef = (db, uid) => doc(db, 'organiserApplications', uid);
const plan = 'Monthly pottery evenings at a studio in the centre.';
const application = (extra = {}) => ({ plan, status: 'pending', ts: serverTimestamp(), ...extra });
await check('visitor applies to organise', assertSucceeds(setDoc(appRef(cara, 'cara'), application())));
await check('applicant reads their own application', assertSucceeds(getDoc(appRef(cara, 'cara'))));
await check('nobody else reads an application', assertFails(getDoc(appRef(mallory, 'cara'))));
await check('visitor cannot list applications', assertFails(getDocs(collection(mallory, 'organiserApplications'))));
await check('cannot apply as already approved', assertFails(setDoc(appRef(mallory, 'mallory'), application({ status: 'approved' }))));
await check('cannot apply for someone else', assertFails(setDoc(appRef(mallory, 'bob'), application())));
await check('application plan too short denied', assertFails(setDoc(appRef(mallory, 'mallory'), application({ plan: 'pots' }))));
await check('applicant cannot approve themselves', assertFails(updateDoc(appRef(cara, 'cara'), { status: 'approved', decidedAt: serverTimestamp(), decidedBy: 'cara' })));
await check('viewer cannot approve', assertFails(updateDoc(appRef(vic, 'cara'), { status: 'approved', decidedAt: serverTimestamp(), decidedBy: 'vic' })));
await check('admin lists applications', assertSucceeds(getDocs(collection(vic, 'organiserApplications'))));

const organiserEvent = (pid, extra = {}) => ({
  title: 'Pottery evening', description: 'Pottery evening', category: 'Creative', price: 12, minParticipants: 8, status: 'Pending',
  imageUrls: [], emoji: '💡', accent: '#818cf8', durationHours: 2, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0, bringYourOwn: '',
  venueNote: '', season: 'any', origin: 'proposal', proposalId: pid, organiserPublicId: pidCara, organizerId: 'organiser',
  byApprovedOrganiser: true, createdAt: serverTimestamp(), participantsCount: 0, impressions: 0, opens: 0, joins: 0, organiserInterest: 0, ...extra,
});
const publish = (db, { pid, eid, uid = 'cara', event: extraEvent = {} }) => {
  const b = writeBatch(db);
  b.set(doc(db, 'proposals', pid), draft({ uid, status: 'approved', eventId: eid, organiserPublicId: pidCara }));
  b.set(doc(db, 'events', eid), organiserEvent(pid, extraEvent));
  return b.commit();
};
await check('pending applicant cannot publish an event', assertFails(publish(cara, { pid: 'cara-pub-0', eid: 'cara-event-0' })));
await check('editor cannot decide an application', assertFails(updateDoc(appRef(erin, 'cara'), { status: 'approved', decidedAt: serverTimestamp(), decidedBy: 'erin' })));
await check('owner approves the application', assertSucceeds(updateDoc(appRef(alice, 'cara'), { status: 'approved', decidedAt: serverTimestamp(), decidedBy: 'alice' })));
await check('approved organiser publishes their own event', assertSucceeds(publish(cara, { pid: 'cara-pub-1', eid: 'cara-event-1' })));
await check('published event cannot start with joins', assertFails(publish(cara, { pid: 'cara-pub-2', eid: 'cara-event-2', event: { participantsCount: 5 } })));
await check('published event cannot be confirmed', assertFails(publish(cara, { pid: 'cara-pub-3', eid: 'cara-event-3', event: { status: 'Confirmed' } })));
await check('published event cannot carry a date', assertFails(publish(cara, { pid: 'cara-pub-4', eid: 'cara-event-4', event: { dateConfirmed: true } })));
await check('event without its own proposal denied', assertFails(setDoc(doc(cara, 'events', 'cara-event-5'), organiserEvent('cara-pub-1'))));
await check('approved proposal without its event denied', assertFails(setDoc(doc(cara, 'proposals', 'cara-pub-6'), draft({ status: 'approved', eventId: 'nope' }))));
await check('a visitor who was not approved cannot publish', assertFails(publish(mallory, { pid: 'm-pub', eid: 'm-event', uid: 'mallory' })));
await check('a normal proposal cannot carry an eventId', assertFails(addDoc(collection(bob, 'proposals'), proposal({ eventId: 'board-games' }))));
await check('approved organiser publishes from a draft', assertSucceeds((async () => {
  await setDoc(doc(cara, 'proposals', 'cara-draft-9'), draft({ organiserPublicId: pidCara }));
  await publish(cara, { pid: 'cara-draft-9', eid: 'cara-event-9' });
})()));
await check('applicant withdraws the application', assertSucceeds(deleteDoc(appRef(cara, 'cara'))));
await check('after withdrawing, publishing is denied', assertFails(publish(cara, { pid: 'cara-pub-7', eid: 'cara-event-7' })));

// ------------------------------------------------------------------ A/B test: variant stamps and per-page visits
const abby = as('abby');
const abel = as('abel');
const abVisit = (db, src, fields) => setDoc(doc(db, 'visits', src), fields, { merge: true });
await check('A/B: a visit to page A counts in the total and for A', assertSucceeds(abVisit(anon, 'ab-poster', { count: increment(1), simple: increment(1) })));
await check('A/B: a visit to page B counts in the total and for B', assertSucceeds(abVisit(anon, 'ab-poster', { count: increment(1), current: increment(1) })));
await check('A/B: an older client counting only the total still works', assertSucceeds(abVisit(anon, 'ab-poster', { count: increment(1) })));
await expectEqual('A/B: total 3', (async () => { let n; await env.withSecurityRulesDisabled(async (ctx) => { n = (await getDoc(doc(ctx.firestore(), 'visits', 'ab-poster'))).data(); }); return `${n.count}/${n.simple}/${n.current}`; })(), '3/1/1');
await check('A/B: one visit cannot count for both pages', assertFails(abVisit(anon, 'ab-poster', { count: increment(1), simple: increment(1), current: increment(1) })));
await check('A/B: a page count cannot move without the total', assertFails(abVisit(anon, 'ab-poster', { simple: increment(1) })));
await check('A/B: a page count cannot jump', assertFails(abVisit(anon, 'ab-poster', { count: increment(1), simple: increment(2) })));
await check('A/B: a page count cannot go down', assertFails(abVisit(anon, 'ab-poster', { count: increment(1), current: increment(-1) })));
await check('A/B: no other page names', assertFails(abVisit(anon, 'ab-poster', { count: increment(1), other: increment(1) })));
await check('A/B: a new source can start on a page', assertSucceeds(abVisit(anon, 'ab-new', { count: increment(1), current: increment(1) })));
await check('A/B: a new source cannot start above 1', assertFails(setDoc(doc(anon, 'visits', 'ab-new2'), { count: 1, simple: 2 })));

await check('A/B: the users doc takes the page when the ID is made', assertSucceeds(setDoc(doc(abby, 'users', 'abby'), touch('abby', { variant: 'simple' }))));
await check('A/B: the page cannot be changed later', assertFails(updateDoc(doc(abby, 'users', 'abby'), { variant: 'current' })));
await check('A/B: an unknown page is refused', assertFails(setDoc(doc(abel, 'users', 'abel'), touch('abel', { variant: 'c' }))));
await check('A/B: an older ID can take its page once', assertSucceeds(updateDoc(doc(bob, 'users', 'bob'), { variant: 'current-test' })));
await check('A/B: a pick records its page', assertSucceeds((async () => {
  const b = writeBatch(abby);
  b.set(pRef(abby, 'mixed', 'abby'), { joinedAt: serverTimestamp(), priceSeen: 0, source: 'test', variant: 'simple' });
  b.update(doc(abby, 'events', 'mixed'), { participantsCount: increment(1), joins: increment(1) });
  await b.commit();
})()));
await check('A/B: a pick with an unknown page is refused', assertFails((async () => {
  const b = writeBatch(abel);
  b.set(pRef(abel, 'mixed', 'abel'), { joinedAt: serverTimestamp(), priceSeen: 0, source: 'test', variant: 'b' });
  b.update(doc(abel, 'events', 'mixed'), { participantsCount: increment(1), joins: increment(1) });
  await b.commit();
})()));
await check('A/B: a helper offer records its page', assertSucceeds((async () => {
  const b = writeBatch(abby);
  b.set(hRef(abby, 'mixed', 'abby'), { ranBefore: 'no', ts: serverTimestamp(), variant: 'simple' });
  b.update(doc(abby, 'events', 'mixed'), { organiserInterest: increment(1) });
  await b.commit();
})()));
await check('A/B: a message records its page', assertSucceeds(addDoc(collection(abby, 'suggestions'), { uid: 'abby', text: '[Run] Salsa', source: 'test', ts: serverTimestamp(), variant: 'simple' })));
await check('A/B: a message with an unknown page is refused', assertFails(addDoc(collection(abby, 'suggestions'), { uid: 'abby', text: 'x', source: 'test', ts: serverTimestamp(), variant: 'z' })));
await check('A/B: analytics record their page', assertSucceeds(addDoc(collection(abby, 'analytics'), { uid: 'abby', name: 'page_view', payload: {}, source: 'test', ts: serverTimestamp(), variant: 'simple-test' })));

// ------------------------------------------------------------------ suggestions + space offers (unchanged flow)
await check('suggestion saves', assertSucceeds(addDoc(collection(bob, 'suggestions'), { uid: 'bob', text: 'More chess', source: 'test', ts: serverTimestamp() })));
await check('space offer saves', assertSucceeds(addDoc(collection(bob, 'venueOffers'), { uid: 'bob', spaceType: 'room', capacity: 20, source: 'test', ts: serverTimestamp() })));
await check('editor cannot read space offers', assertFails(getDocs(collection(erin, 'venueOffers'))));
await check('editor cannot read suggestions', assertFails(getDocs(collection(erin, 'suggestions'))));
await check('editor cannot read helper offers', assertFails(getDocs(collectionGroup(erin, 'helpers'))));
await check('viewer cannot read space offers', assertFails(getDocs(collection(vic, 'venueOffers'))));
await check('owner reads space offers', assertSucceeds(getDocs(collection(alice, 'venueOffers'))));
await check('owner reads suggestions', assertSucceeds(getDocs(collection(alice, 'suggestions'))));
await check('owner reads helper offers', assertSucceeds(getDocs(collectionGroup(alice, 'helpers'))));
await check('owner reads proposals', assertSucceeds(getDocs(collection(alice, 'proposals'))));
await check('editor can still edit an event', assertSucceeds(updateDoc(doc(erin, 'events', 'board-games'), { title: 'Board games', description: 'd', category: 'Games', status: 'Pending', media: [] })));

await env.cleanup();
console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
