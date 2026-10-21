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

/** "+31 6…" — enough for someone to recognise their own number, not enough to read it. */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  if (/^\+\d{3}/.test(phone)) return `${phone.slice(0, 3)} ${phone[3]}…`;
  return `${phone.slice(0, 2)}…`;
}
