/**
 * Runs the app's real write paths against the Firestore emulator and the real rules, so a
 * rule change that breaks a legitimate flow fails here. Skipped unless the emulator is up
 * (npm run test:rules starts it and sets FIRESTORE_EMULATOR_HOST).
 */
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

const current = vi.hoisted(() => ({ uid: 'visitor', db: null as any }));
vi.mock('../lib/firebase', () => ({
  get db() {
    return current.db;
  },
  auth: {
    get currentUser() {
      return { uid: current.uid, isAnonymous: true };
    },
    authStateReady: async () => {},
  },
}));

// The anonymous account itself is deleted last by "Delete my data"; the auth stub has nothing to delete.
vi.mock('firebase/auth', async (original) => ({ ...(await original<typeof import('firebase/auth')>()), deleteUser: vi.fn(async () => {}) }));

import {
  joinEvent,
  leaveEvent,
  submitHelperInterest,
  withdrawHelperInterest,
  recordPriceAnswer,
  bumpEventCounter,
  submitProposal,
  submitSuggestion,
  submitVenueOffer,
  seedEvents,
  showMyInitial,
  setSaved,
  setPreferredTiming,
  setMode,
} from './firebaseService';
import { touchUser, linkContact, setConsent, saveDisplayName, deleteMyContact } from './identity';
import { applyCounterFixes, grantAdmin, purgeNonSeedEvents, revokeAdmin } from './adminService';
import { savePublicProfile, deletePublicProfile } from './profileService';
import { writeProposal, deleteDraft } from './organiserService';
import { deleteAllMyData } from './accountService';
import { countersToFix } from '../pages/admin/recount';

const host = process.env.FIRESTORE_EMULATOR_HOST;
let env: RulesTestEnvironment;

const act = (uid: string) => {
  current.uid = uid;
  current.db = env.authenticatedContext(uid).firestore();
};
const raw = async <T,>(fn: (db: any) => Promise<T>): Promise<T> => {
  let out: T;
  await env.withSecurityRulesDisabled(async (ctx) => {
    out = await fn(ctx.firestore());
  });
  return out!;
};
const eventField = (id: string, f: string) => raw(async (db) => (await getDoc(doc(db, 'events', id))).data()?.[f]);
const event = { title: 't', description: 'd', category: 'Games', status: 'Pending', participantsCount: 0, joins: 0, impressions: 0, opens: 0, organiserInterest: 0, price: 5 };

describe.skipIf(!host)('client flows against the rules', () => {
  beforeAll(async () => {
    const [h, port] = host!.split(':');
    env = await initializeTestEnvironment({
      projectId: 'demo-agorax',
      firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: h, port: Number(port) },
    });
    await env.clearFirestore();
    await raw(async (db) => {
      await setDoc(doc(db, 'admins', 'owner1'), { role: 'owner', label: 'Owner', grantedBy: 'console' });
      await setDoc(doc(db, 'events', 'e1'), event);
      await setDoc(doc(db, 'events', 'e2'), event);
      await setDoc(doc(db, 'events', 'drift'), event);
      await setDoc(doc(db, 'events', 'drift', 'participants', 'visitor'), { joinedAt: new Date(), priceSeen: 5, source: 'old' });
    });
  });

  afterAll(async () => {
    await env?.cleanup();
  });

  it('first visit creates the users doc', async () => {
    act('visitor');
    await touchUser();
    const me = await raw(async (db) => (await getDoc(doc(db, 'users', 'visitor'))).data());
    expect(me).toMatchObject({ uid: 'visitor', shareCode: 'visitor', hasContact: false });
  });

  it('join, double join, leave and rejoin keep the count at the real number', async () => {
    act('visitor');
    expect(await joinEvent('e1', 'visitor', { priceSeen: 5, source: 'direct' })).toBe(true);
    expect(await joinEvent('e1', 'visitor', { priceSeen: 5, source: 'direct' })).toBe(false);
    expect(await eventField('e1', 'participantsCount')).toBe(1);
    await showMyInitial('e1', 'visitor', 'V');
    expect(await leaveEvent('e1', 'visitor')).toBe(true);
    expect(await eventField('e1', 'participantsCount')).toBe(0);
    expect(await joinEvent('e1', 'visitor', { priceSeen: 5, source: 'direct' })).toBe(true);
    expect(await eventField('e1', 'participantsCount')).toBe(1);
    expect(await eventField('e1', 'joins')).toBe(1);
  });

  it('leaving an event whose counter drifted to 0 works and stays at 0', async () => {
    act('visitor');
    expect(await leaveEvent('drift', 'visitor')).toBe(true);
    expect(await eventField('drift', 'participantsCount')).toBe(0);
  });

  it('organiser offer counts once, resending updates the answer', async () => {
    act('visitor');
    const v = { firstName: 'Vi', phone: '+31612345678', email: 'vi@example.com', ranBefore: 'yes' as const };
    expect(await submitHelperInterest('e1', 'visitor', v)).toBe(true);
    expect(await submitHelperInterest('e1', 'visitor', { ...v, ranBefore: 'no' })).toBe(false);
    expect(await eventField('e1', 'organiserInterest')).toBe(1);
  });

  it('price answers save for several events', async () => {
    act('visitor');
    await recordPriceAnswer('visitor', 'e1', 5, 6, 'yes');
    await recordPriceAnswer('visitor', 'e2', 5, 7, 'depends');
    await recordPriceAnswer('visitor', 'e1', 5, 6, 'no');
    const me = await raw(async (db) => (await getDoc(doc(db, 'users', 'visitor'))).data());
    expect(Object.keys(me!.priceAnswers).sort()).toEqual(['e1', 'e2']);
    expect(me!.priceAnswers.e1.answer).toBe('no');
  });

  it('view counters move once per visitor', async () => {
    act('visitor');
    await bumpEventCounter('e2', 'impressions');
    await bumpEventCounter('e2', 'impressions');
    await bumpEventCounter('e2', 'opens');
    expect(await eventField('e2', 'impressions')).toBe(1);
    expect(await eventField('e2', 'opens')).toBe(1);
  });

  it('contact, consent, display name and erasure all save', async () => {
    act('visitor');
    await linkContact({ email: 'Vi@Example.com', phone: '06 1234 5678', purpose: 'updates' });
    await setConsent('updates', false);
    await setConsent('updates', true);
    await saveDisplayName('Vi');
    const before = await raw(async (db) => (await getDoc(doc(db, 'users', 'visitor'))).data());
    expect(before).toMatchObject({ hasContact: true, email: 'vi@example.com', displayName: 'Vi' });
    await deleteMyContact();
    const after = await raw(async (db) => (await getDoc(doc(db, 'users', 'visitor'))).data());
    expect(after).toMatchObject({ hasContact: false });
    expect(after).not.toHaveProperty('email');
    expect(after).not.toHaveProperty('consents');
  });

  // ensureAnonymousAuth caches the first user, so the visitor-side steps all run as one uid.
  it('typing an email no longer writes lookup keys or merge requests', async () => {
    act('visitor');
    await linkContact({ email: 'vi@example.com', phone: '+31612345678', purpose: 'organising' });
    expect(await raw(async (db) => (await getDocs(collection(db, 'contactKeys'))).size)).toBe(0);
    expect(await raw(async (db) => (await getDocs(collection(db, 'mergeRequests'))).size)).toBe(0);
  });

  it('saved events, timing preference and Attend/Organise/Both save privately', async () => {
    act('visitor');
    await setSaved('visitor', 'e2', true);
    await setSaved('visitor', 'e1', true);
    await setSaved('visitor', 'e1', false);
    await setPreferredTiming('visitor', 'weekend');
    await setMode('visitor', 'both');
    const me = await raw(async (db) => (await getDoc(doc(db, 'users', 'visitor'))).data());
    expect(me).toMatchObject({ savedEvents: ['e2'], preferredTiming: 'weekend', mode: 'both' });
    expect(await eventField('e2', 'participantsCount')).toBe(0); // saving is not interest
  });

  it('optional launch news is stored with the notice version and can be switched off', async () => {
    act('visitor');
    await linkContact({ email: 'vi@example.com', purpose: 'updates', alsoConsent: ['launch'] });
    let me = await raw(async (db) => (await getDoc(doc(db, 'users', 'visitor'))).data());
    expect(me!.consents.launch).toMatchObject({ version: 'v2', notice: 'draft-2026-10' });
    expect(me!.consents.invites).toBeUndefined();
    await setConsent('launch', false);
    me = await raw(async (db) => (await getDoc(doc(db, 'users', 'visitor'))).data());
    expect(me!.consents.launch).toBeUndefined();
    expect(me!.consents.updates).toBeDefined();
  });

  it('public profile is created under a random id, never the uid, and can be deleted', async () => {
    act('visitor');
    const jpeg = 'data:image/jpeg;base64,' + 'A'.repeat(1000);
    const id = await savePublicProfile(undefined, { displayName: 'Vi', bio: 'Climbing', avatar: jpeg, coverY: 30, organiser: { enabled: true, kind: 'individual', name: 'Vi', about: '' } });
    expect(id).toMatch(/^[A-Za-z0-9]{20}$/);
    expect(id).not.toContain('visitor');
    const profile = await raw(async (db) => (await getDoc(doc(db, 'profiles', id))).data());
    expect(profile).toMatchObject({ displayName: 'Vi', bio: 'Climbing', coverY: 30 });
    expect(JSON.stringify(profile)).not.toMatch(/visitor|vi@example\.com/);
    expect(await savePublicProfile(id, { displayName: 'Vi R' })).toBe(id);
    await deletePublicProfile(id);
    expect(await raw(async (db) => (await getDoc(doc(db, 'profiles', id))).exists())).toBe(false);
    expect((await raw(async (db) => (await getDoc(doc(db, 'users', 'visitor'))).data()))!.publicId).toBeUndefined();
  });

  it('organiser drafts, edits, sends, and deletes only unsent drafts', async () => {
    act('visitor');
    const d = { title: 'Pottery night', category: 'Creative' as const, price: 12, minPeople: 8, needs: '' };
    const id = await writeProposal(null, d, 'draft');
    await writeProposal(id, { ...d, title: 'Pottery evening' }, 'draft');
    const other = await writeProposal(null, { ...d, title: 'Throwaway' }, 'draft');
    await deleteDraft(other);
    await submitProposal({ ...d, title: 'Pottery evening', firstName: 'Vi', phone: '', email: 'vi@example.com', draftId: id });
    const sent = await raw(async (db) => (await getDoc(doc(db, 'proposals', id))).data());
    expect(sent).toMatchObject({ title: 'Pottery evening', status: 'new', uid: 'visitor' });
    expect(await raw(async (db) => (await getDoc(doc(db, 'proposals', other))).exists())).toBe(false);
    await expect(deleteDraft(id)).rejects.toThrow();
  });

  it('withdrawing a helper offer lowers organiser interest by one', async () => {
    act('visitor');
    expect(await eventField('e1', 'organiserInterest')).toBe(1);
    expect(await withdrawHelperInterest('e1', 'visitor')).toBe(true);
    expect(await eventField('e1', 'organiserInterest')).toBe(0);
    expect(await withdrawHelperInterest('e1', 'visitor')).toBe(false);
  });

  it('proposal, suggestion and space offer save', async () => {
    act('visitor');
    await submitProposal({ title: 'Salsa night', category: 'Social', price: 5, minPeople: 10, needs: '', firstName: 'Vi', phone: '+31612345678' });
    await submitSuggestion({ text: 'More chess' });
    await submitVenueOffer({ name: 'Vi', spaceType: 'room', capacity: 20, contact: 'vi@example.com' });
    expect(await raw(async (db) => (await getDocs(query(collection(db, 'proposals'), where('title', '==', 'Salsa night')))).size)).toBe(1);
  });

  it('"Delete my data" withdraws interests, deletes drafts, profile and the users doc, and keeps sent proposals', async () => {
    // ensureAnonymousAuth caches the first user, so this runs as "visitor" too.
    act('visitor');
    expect(await joinEvent('e2', 'visitor', { priceSeen: 5, source: 'direct' })).toBe(true);
    await writeProposal(null, { title: 'Draft to drop', category: 'Games', price: 1, minPeople: 2, needs: '' }, 'draft');
    await savePublicProfile(undefined, { displayName: 'Vi' });
    const report = await deleteAllMyData(['e1', 'e2', 'drift']);
    expect(report.interestsWithdrawn).toBe(2); // e1 and e2
    expect(report.draftsDeleted).toBe(1);
    expect(report.sentProposalsKept).toBeGreaterThanOrEqual(2);
    expect(await eventField('e1', 'participantsCount')).toBe(0);
    expect(await eventField('e2', 'participantsCount')).toBe(0);
    expect(await raw(async (db) => (await getDoc(doc(db, 'users', 'visitor'))).exists())).toBe(false);
    expect(await raw(async (db) => (await getDocs(collection(db, 'profiles'))).size)).toBe(0);
  });

  it('owner grants and revokes admins, seeds, fixes counts and purges', async () => {
    act('owner1');
    await grantAdmin('helper1', 'editor', '  Anna  ', 'owner1');
    expect(await raw(async (db) => (await getDoc(doc(db, 'admins', 'helper1'))).data()?.label)).toBe('Anna');
    await revokeAdmin('helper1');
    await expect(revokeAdmin('owner1')).rejects.toThrow();

    const seeded = await seedEvents();
    expect(seeded.created).toBe(33);

    await raw((db) => setDoc(doc(db, 'events', 'e1'), { participantsCount: 9, joins: 9 }, { merge: true }));
    const events = await raw(async (db) => (await getDocs(collection(db, 'events'))).docs.map((d) => ({ id: d.id, ...d.data() }) as any));
    const participants = await raw(async (db) => (await getDocs(collection(db, 'events', 'e1', 'participants'))).docs.map(() => ({ eventId: 'e1' })));
    const helpers = await raw(async (db) => (await getDocs(collection(db, 'events', 'e1', 'helpers'))).docs.map(() => ({ eventId: 'e1' })));
    const fixes = countersToFix(events, participants, helpers).filter((f) => f.id === 'e1');
    expect(fixes).toHaveLength(1);
    await applyCounterFixes(fixes);
    expect(await eventField('e1', 'participantsCount')).toBe(participants.length);

    const purged = await purgeNonSeedEvents();
    expect(purged.events).toBeGreaterThanOrEqual(3);
    expect(await eventField('e1', 'title')).toBeUndefined();
  });
});
