/**
 * "Once per session" guard shared by analytics, impressions and opens.
 * The Set lives in module scope; sessionStorage backs it so a reload inside the
 * same browser tab (very common when a QR scan opens a page twice) does not recount.
 */
const seen = new Set<string>();
const STORAGE_KEY = 'agorax_session_once';

let hydrated = false;
function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) (JSON.parse(raw) as string[]).forEach((k) => seen.add(k));
  } catch {
    /* sessionStorage unavailable (private mode) — module Set still works */
  }
}

const DEVICE_KEY = 'agorax_counted';

/**
 * Like once(), but remembered across sessions on this device (localStorage). Used for the
 * per-visitor view counters, which the rules accept only once per uid anyway.
 */
export function onceOnDevice(key: string): boolean {
  let counted: string[] = [];
  try {
    counted = JSON.parse(localStorage.getItem(DEVICE_KEY) ?? '[]');
  } catch {
    /* unavailable or corrupt: fall back to the session guard */
  }
  if (!Array.isArray(counted)) counted = [];
  if (counted.includes(key)) return false;
  if (!once(`device:${key}`)) return false;
  try {
    localStorage.setItem(DEVICE_KEY, JSON.stringify([...counted, key]));
  } catch {
    /* ignore */
  }
  return true;
}

/** Returns true the first time `key` is seen in this session, false afterwards. */
export function once(key: string): boolean {
  hydrate();
  if (seen.has(key)) return false;
  seen.add(key);
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    /* ignore */
  }
  return true;
}
