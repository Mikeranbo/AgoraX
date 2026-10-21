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
