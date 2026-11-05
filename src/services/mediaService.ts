import { doc, updateDoc } from 'firebase/firestore';
import { app, db } from '../lib/firebase';
import type { EventMedia } from '../types';

/** Uploaded videos: mp4 or webm, at most 50 MB (storage.rules enforce the same). */
export const VIDEO_TYPES = ['video/mp4', 'video/webm'];
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

/** Uploaded photos: jpeg, png or webp, at most 10 MB (storage.rules enforce the same). */
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/** Longest side of an uploaded gallery photo. */
const PHOTO_MAX_SIDE = 2000;

export function videoFileProblem(file: Pick<File, 'type' | 'size'>): string | null {
  if (!VIDEO_TYPES.includes(file.type)) return 'Videos have to be mp4 or webm.';
  if (file.size > MAX_VIDEO_BYTES) return 'That video is over 50 MB. Shorten or compress it first.';
  return null;
}

/**
 * A gallery photo, ready to upload: at most 2000 px on its longest side, saved again as JPEG.
 * Saving it again also drops the camera's metadata, such as where the photo was taken.
 */
export async function preparePhoto(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('not an image'));
      i.src = url;
    });
    const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) throw new Error('could not encode');
    if (blob.size > MAX_PHOTO_BYTES) throw new Error('photo too large');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Uploads a photo or video to Firebase Storage under events/<eventId>/ and returns its URL. The
 * Storage SDK is loaded only here, so visitors never download it.
 */
export async function uploadEventFile(
  eventId: string,
  file: Blob,
  name: string,
  onProgress?: (share: number) => void,
): Promise<string> {
  const { getStorage, ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
  const safeName = name.replace(/[^\w.-]+/g, '-').slice(-60);
  const target = ref(getStorage(app), `events/${eventId}/${Date.now()}-${safeName}`);
  const task = uploadBytesResumable(target, file, { contentType: file.type });
  await new Promise<void>((resolve, reject) => {
    task.on('state_changed', (s) => onProgress?.(s.bytesTransferred / Math.max(1, s.totalBytes)), reject, () => resolve());
  });
  return getDownloadURL(task.snapshot.ref);
}

/** A photo from the device, made smaller and uploaded to the event's folder. */
export async function uploadEventPhoto(eventId: string, file: File): Promise<string> {
  const blob = await preparePhoto(file);
  const base = file.name.replace(/\.[^.]*$/, '') || 'photo';
  return uploadEventFile(eventId, blob, `${base}.jpg`);
}

/** Saves an event's gallery (editors, or the event's own organiser; see firestore.rules). */
export async function saveEventMedia(eventId: string, media: EventMedia[]): Promise<void> {
  await updateDoc(doc(db, 'events', eventId), { media });
}
