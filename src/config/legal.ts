/**
 * Operator facts for the footer, the Imprint and the Terms. AgoraX is run by a private person;
 * it is not a registered company yet, so there is no KvK or VAT number. Never fill these with
 * made-up values.
 */
export const LEGAL = {
  legalName: 'Michael Aleinikov',
  postalAddress: 'Suikerlaan 1, 9743 DA Groningen, the Netherlands',
  /** KvK registration number: none yet. */
  registrationNumber: null as string | null,
};

/** Social profiles shown in the footer; none exist yet. */
export const SOCIAL_LINKS: { label: string; href: string }[] = [];
