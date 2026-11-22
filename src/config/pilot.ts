/**
 * Pilot-wide settings. All of them are public configuration (they ship in the browser bundle);
 * none is a secret.
 */

/** Every proposal without its own `city` is organised in or from this city. */
export const PILOT_CITY = 'Groningen';

/** Dates and "today"/"tomorrow" are worked out in the pilot city's time zone. */
export const PILOT_TIME_ZONE = 'Europe/Amsterdam';

/** Version of the privacy notice that consents are given under (stored with each consent). */
export const NOTICE_VERSION = '1.2-2026-11-22';

/** Privacy notice 1.1 (docs/PRIVACY_NOTICE_FINAL.md) is approved; Vercel sets VITE_PRIVACY_NOTICE_FINAL=true. */
export const PRIVACY_NOTICE_FINAL = import.meta.env.VITE_PRIVACY_NOTICE_FINAL === 'true';

/**
 * Public profiles (photo, cover, bio, organiser identity) and the optional launch and invitation
 * emails are NOT described in privacy notice 1.1, so they stay off in the live site even with the
 * notice final. They need a notice that covers them and VITE_EXTRA_DATA_FEATURES=true as well.
 * The browser tests switch both on to keep those screens tested.
 */
export const EXTRA_DATA_FEATURES = PRIVACY_NOTICE_FINAL && import.meta.env.VITE_EXTRA_DATA_FEATURES === 'true';

/** Where people send privacy requests today (the address the existing notice already names). */
export const CONTACT_EMAIL = 'mikhailalenikau@gmail.com';
