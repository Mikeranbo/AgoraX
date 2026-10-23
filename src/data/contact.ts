export function normaliseEmail(raw?: string): string {
  return (raw ?? '').trim().toLowerCase();
}

/** Strips formatting; assumes a Dutch national number (06…) when no country code is given. */
export function normalisePhone(raw?: string): string {
  let p = (raw ?? '').replace(/[\s().-]/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (!p.startsWith('+') && /^0\d{9}$/.test(p)) p = '+31' + p.slice(1);
  return p;
}

async function sha256Hex(input: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // crypto.subtle only exists on https/localhost; a phone testing over http://192.168.x.x
  // would otherwise fail here. FNV-1a is enough for an opaque, stable document id.
  let h1 = 0x811c9dc5;
  let h2 = 0x1b873593;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0;
  }
  return 'f' + h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

/**
 * Id of the retired contactKeys/{id} lookup document for an email or phone, kept only so
 * erasure can delete keys older versions wrote. The detail is normalised first, so
 * "06 1234 5678" and "+31612345678" give the same key.
 */
export function contactKeyFor(kind: 'email' | 'phone', raw: string): Promise<string> {
  const value = kind === 'email' ? normaliseEmail(raw) : normalisePhone(raw);
  return sha256Hex(`${kind}:${value}`);
}

/** "+31 6…" — enough for someone to recognise their own number, not enough to read it. */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  if (/^\+\d{3}/.test(phone)) return `${phone.slice(0, 3)} ${phone[3]}…`;
  return `${phone.slice(0, 2)}…`;
}
