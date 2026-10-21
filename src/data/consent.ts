/**
 * One consent per purpose (GDPR: never bundle purposes). The version is stored with each
 * consent so we can show later exactly which sentence a person agreed to.
 */
export type ConsentPurpose = 'updates' | 'organising' | 'proposal' | 'space';

export const CONSENT_VERSION = 'v1';

export const CONSENT_TEXTS: Record<ConsentPurpose, string> = {
  // Fixed wording from APP_CHANGES.md §7.
  updates:
    "We'll only use this to tell you when an event you picked is happening. Nothing else, and you can ask us to delete it any time.",
  organising:
    "We'll only use this to talk to you about running this event. Nothing else, and you can ask us to delete it any time.",
  proposal:
    "We'll only use this to talk to you about the event you proposed. Nothing else, and you can ask us to delete it any time.",
  space:
    "We'll only use this to talk to you about using your space for an event. Nothing else, and you can ask us to delete it any time.",
};
