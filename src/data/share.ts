const CODE_PATTERN = /^[A-Za-z0-9]{4,40}$/;

function cleanSource(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
}

/**
 * Which poster (or share) brought this phone here. First touch wins: a stored value is never
 * replaced. A shared link without a poster id counts as 'share'.
 */
export function resolveSource(params: URLSearchParams, stored: string | null): string {
  if (stored) return stored;
  const src = cleanSource(params.get('src') ?? '');
  if (src) return src;
  if (CODE_PATTERN.test(params.get('ref') ?? '')) return 'share';
  return 'direct';
}

/** The code a visitor's share links carry. */
export function shareCodeFor(uid: string): string {
  return uid.slice(0, 8);
}

export function buildShareUrl(origin: string, code: string, eventId: string): string {
  return `${origin.replace(/\/+$/, '')}/?ref=${encodeURIComponent(code)}&e=${encodeURIComponent(eventId)}`;
}

/** A referrer code worth recording: well-formed, and not the visitor's own link. */
export function acceptReferrer(ref: string | null, ownCode: string): string | null {
  if (!ref || !CODE_PATTERN.test(ref) || ref === ownCode) return null;
  return ref;
}
