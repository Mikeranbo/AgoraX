/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" once docs/PRIVACY_NOTICE_DRAFT.md is final (see src/config/pilot.ts). Public, not secret. */
  readonly VITE_PRIVACY_NOTICE_FINAL?: string;
  /** "1" to point the app at the local Firebase emulators (tests only). */
  readonly VITE_FIREBASE_EMULATORS?: string;
}
