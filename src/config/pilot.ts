/**
 * Pilot-wide settings. All of them are public configuration (they ship in the browser bundle);
 * none is a secret.
 */

/** Every proposal without its own `city` is organised in or from this city. */
export const PILOT_CITY = 'Groningen';

/** Dates and "today"/"tomorrow" are worked out in the pilot city's time zone. */
export const PILOT_TIME_ZONE = 'Europe/Amsterdam';

/** Version of the privacy notice that consents are given under (stored with each consent). */
export const NOTICE_VERSION = 'draft-2026-10';

/**
 * The privacy notice is still a draft with open facts (docs/PRIVACY_NOTICE_DRAFT.md). Until it
 * is final, the app does not collect the new kinds of personal data the draft cannot cover yet:
 * public profile text and photos, organiser identity, and launch/invitation emails. The screens
 * exist and explain this. Set VITE_PRIVACY_NOTICE_FINAL=true once the notice is approved.
 */
export const PRIVACY_NOTICE_FINAL = import.meta.env.VITE_PRIVACY_NOTICE_FINAL === 'true';

/** Where people send privacy requests today (the address the existing notice already names). */
export const CONTACT_EMAIL = 'sondarevn@gmail.com';
