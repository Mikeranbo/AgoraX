/**
 * Local emulator only. The 40 real events (with a few made-up sign-up counts) so a concept branch
 * can be looked at with real content, and a helper that makes a test browser the owner.
 * By hand: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx -e "import('./e2e/seed-real.ts').then((m) => m.seedRealEvents())"
 */
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { SEED_EVENTS } from '../src/data/seedEvents';

async function withEmulator(fn: (db: any) => Promise<void>, clear = false) {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':');
  const env = await initializeTestEnvironment({
    projectId: 'demo-agorax',
    firestore: { host, port: Number(port), rules: readFileSync('firestore.rules', 'utf8') },
  });
  if (clear) await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()));
  await env.cleanup();
}

export async function seedRealEvents() {
  await withEmulator(async (db) => {
    for (const [i, s] of SEED_EVENTS.entries()) {
      const { steps, ...rest } = s as any;
      await setDoc(doc(db, 'events', s.slug), {
        ...rest,
        status: 'Pending',
        createdAt: new Date(),
        participantsCount: i % 5,
        joins: i % 5,
        impressions: 0,
        opens: 0,
        organiserInterest: 0,
      });
    }
  }, true);
}

/** Makes this browser's anonymous uid the owner, as the console does for Mike. */
export async function makeOwner(uid: string) {
  await withEmulator(async (db) => {
    await setDoc(doc(db, 'admins', uid), { role: 'owner', label: 'Test owner', grantedBy: 'console' });
  });
}
