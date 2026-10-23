// Seeds the local Firestore emulator (demo-agorax) for the browser tests. Never touches a real
// project: it only talks to FIRESTORE_EMULATOR_HOST under a demo- project id.
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';

const HOUR = 60 * 60 * 1000;

export const event = (extra) => ({
  description: 'A test proposal for the browser tests.',
  category: 'Games',
  price: 5,
  minParticipants: 10,
  participantsCount: 0,
  joins: 0,
  impressions: 0,
  opens: 0,
  organiserInterest: 0,
  status: 'Pending',
  organizerId: 'agorax',
  imageUrls: [],
  emoji: '🎲',
  hostsNeeded: 1,
  fixedCost: 0,
  perPersonCost: 0,
  ...extra,
});

export default async function seed() {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':');
  const env = await initializeTestEnvironment({
    projectId: 'demo-agorax',
    firestore: { host, port: Number(port), rules: readFileSync('firestore.rules', 'utf8') },
  });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    // A seeded placeholder date that must never be shown.
    await setDoc(doc(db, 'events', 'chess'), event({ title: 'Chess café', deadline: new Date(Date.now() + 2 * HOUR).toISOString(), startTime: new Date(Date.now() + 3 * HOUR).toISOString() }));
    await setDoc(doc(db, 'events', 'pottery'), event({ title: 'Pottery evening', category: 'Creative', price: 12 }));
    await setDoc(doc(db, 'events', 'assen-walk'), event({ title: 'Drenthe walk', category: 'Outdoor', city: 'Assen', price: 0 }));
    await setDoc(doc(db, 'events', 'ams-museum'), event({ title: 'Amsterdam museum day', category: 'Creative', city: 'Amsterdam', price: 20 }));
    // One real, scheduled event a couple of hours from now.
    await setDoc(
      doc(db, 'events', 'quiz'),
      event({ title: 'Pub quiz night', category: 'Social', status: 'Confirmed', dateConfirmed: true, startTime: new Date(Date.now() + 2 * HOUR).toISOString() }),
    );
  });
  await env.cleanup();
}

if (import.meta.url === `file://${process.argv[1]}`) await seed();
