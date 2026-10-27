import { doc, updateDoc } from 'firebase/firestore';
import { app, db } from '../lib/firebase';
import type { EventMedia } from '../types';

/** Uploaded videos: mp4 or webm, at most 50 MB (storage.rules enforce the same). */
export const VIDEO_TYPES = ['video/mp4', 'video/webm'];
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export function videoFileProblem(file: Pick<File, 'type' | 'size'>): string | null {
  if (!VIDEO_TYPES.includes(file.type)) return 'Videos have to be mp4 or webm.';
  if (file.size > MAX_VIDEO_BYTES) return 'That video is over 50 MB. Shorten or compress it first.';
  return null;
}

/**
 * Uploads a video to Firebase Storage under events/<eventId>/ and returns its URL. The Storage
 * SDK is loaded only here, so visitors never download it.
 */
export async function uploadEventVideo(eventId: string, file: File, onProgress?: (share: number) => void): Promise<string> {
  const { getStorage, ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
  const safeName = file.name.replace(/[^\w.-]+/g, '-').slice(-60);
  const target = ref(getStorage(app), `events/${eventId}/${Date.now()}-${safeName}`);
  const task = uploadBytesResumable(target, file, { contentType: file.type });
  await new Promise<void>((resolve, reject) => {
    task.on('state_changed', (s) => onProgress?.(s.bytesTransferred / Math.max(1, s.totalBytes)), reject, () => resolve());
  });
  return getDownloadURL(task.snapshot.ref);
}

/** Saves an event's gallery (editors, or the event's own organiser; see firestore.rules). */
export async function saveEventMedia(eventId: string, media: EventMedia[]): Promise<void> {
  await updateDoc(doc(db, 'events', eventId), { media });
}
