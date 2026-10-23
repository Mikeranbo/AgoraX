import { deleteField, doc, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ensureAnonymousAuth } from './identity';
import type { PublicProfile } from '../types';

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** A random 20-character public id. It is never derived from the uid. */
export function newPublicId(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ID_CHARS[b % ID_CHARS.length]).join('');
}

/** Only the fields the rules accept, without empty strings. */
export function cleanProfile(p: PublicProfile): Record<string, unknown> {
  const out: Record<string, unknown> = { displayName: p.displayName.trim().slice(0, 40) };
  const text = (key: 'bio' | 'interests' | 'area', max: number) => {
    const v = p[key]?.trim();
    if (v) out[key] = v.slice(0, max);
  };
  text('bio', 280);
  text('interests', 160);
  text('area', 60);
  if (p.avatar) out.avatar = p.avatar;
  if (p.cover) out.cover = p.cover;
  if (typeof p.coverY === 'number') out.coverY = Math.min(100, Math.max(0, Math.round(p.coverY)));
  if (p.organiser) {
    out.organiser = {
      enabled: p.organiser.enabled,
      kind: p.organiser.kind,
      name: p.organiser.name.trim().slice(0, 80),
      about: (p.organiser.about ?? '').trim().slice(0, 500),
    };
  }
  return out;
}

/**
 * Saves the public profile. The first save claims a fresh public id, writes the profile and
 * records the id privately on users/{uid}, all in one batch. Returns the public id.
 */
export async function savePublicProfile(currentPublicId: string | undefined, profile: PublicProfile): Promise<string> {
  const user = await ensureAnonymousAuth();
  const data = { ...cleanProfile(profile), updatedAt: serverTimestamp() };
  if (currentPublicId) {
    await setDoc(doc(db, 'profiles', currentPublicId), data);
    return currentPublicId;
  }
  const id = newPublicId();
  const batch = writeBatch(db);
  batch.set(doc(db, 'profileOwners', id), { uid: user.uid });
  batch.set(doc(db, 'profiles', id), data);
  batch.set(doc(db, 'users', user.uid), { uid: user.uid, publicId: id }, { merge: true });
  await batch.commit();
  return id;
}

/** Removes the public profile, its id claim and the private link to it. */
export async function deletePublicProfile(publicId: string): Promise<void> {
  const user = await ensureAnonymousAuth();
  const batch = writeBatch(db);
  batch.delete(doc(db, 'profiles', publicId));
  batch.delete(doc(db, 'profileOwners', publicId));
  batch.update(doc(db, 'users', user.uid), { publicId: deleteField() });
  await batch.commit();
}

/** Live public profile by id; null when there is none (or it was deleted). */
export function subscribeProfile(publicId: string, callback: (p: PublicProfile | null) => void, onError?: (e: Error) => void) {
  return onSnapshot(
    doc(db, 'profiles', publicId),
    (snap) => callback(snap.exists() ? (snap.data() as PublicProfile) : null),
    (err) => onError?.(err),
  );
}
