/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true": privacy notice 1.1 is final (see src/config/pilot.ts). Public, not secret. */
  readonly VITE_PRIVACY_NOTICE_FINAL?: string;
  /** "true" (tests only, for now): public profiles and launch/invitation emails, which notice 1.1 does not cover. */
  readonly VITE_EXTRA_DATA_FEATURES?: string;
  /** "1" to point the app at the local Firebase emulators (tests only). */
  readonly VITE_FIREBASE_EMULATORS?: string;
}
