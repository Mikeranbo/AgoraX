/**
 * Company facts for the footer. Each one stays null ("to be confirmed") until it is real; the
 * privacy notice draft lists the same open points (docs/PRIVACY_NOTICE_DRAFT.md). Never fill
 * these with made-up values.
 */
export const LEGAL = {
  legalName: null as string | null,
  postalAddress: null as string | null,
  /** KvK registration number. */
  registrationNumber: null as string | null,
  vatId: null as string | null,
};

/** Social profiles shown in the footer; none exist yet. */
export const SOCIAL_LINKS: { label: string; href: string }[] = [];

export const TO_BE_CONFIRMED = 'to be confirmed';
