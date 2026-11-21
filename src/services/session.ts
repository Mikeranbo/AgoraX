/**
 * "Once per page load" guard shared by analytics, impressions, opens and the visit count. It
 * lives in memory only: nothing may be stored on the device before the visitor acts
 * (Telecommunicatiewet 11.7a), and the rules count each person once per event anyway.
 */
const seen = new Set<string>();

const DEVICE_KEY = 'agorax_counted';

/**
 * Like once(), but remembered across visits on this device (localStorage). Used only for the
 * per-visitor view counters, which run only after the visitor allowed statistics.
 */
export function onceOnDevice(key: string): boolean {
  let counted: string[] = [];
  try {
    counted = JSON.parse(localStorage.getItem(DEVICE_KEY) ?? '[]');
  } catch {
    /* unavailable or corrupt: fall back to the page-load guard */
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

/** Returns true the first time `key` is seen since the page loaded, false afterwards. */
export function once(key: string): boolean {
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}
