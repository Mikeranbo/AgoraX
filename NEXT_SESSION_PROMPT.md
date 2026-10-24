# Prompt for the next Claude Code session

Project: `D:\proects\work\agora x\code\code 3` (github.com/Mikeranbo/AgoraX). Firebase project
`agorax-a8d07`, Vercel deploys `main` to https://agora-x.vercel.app.

## State on 24 Oct 2026

- `ec69644` (security + pilot UX) plus a CRLF-safe privacy-notice test are on `main` and live.
  The new `firestore.rules` were deployed first, then the frontend (Vercel).
- Backup of the pre-integration state: `D:\proects\work\agora x\code\backups\code3-before-ec69644-2026-10-23\`
  and local branch `backup/before-ec69644`. Keep it.
- Tests: lint, build, `npm test` (110 passed, 16 emulator tests skipped there), `npm run test:rules`
  (189/189 + 16/16), `npm run test:e2e` (47 passed, 4 device skips, 1 flaky page-setup timeout that
  passes on rerun).
- Live smoke test done: 33 events load, join → leave → rejoin → leave moves the count 1→2→1→2→1,
  no console or permission errors, /admin for a non-admin shows "Not authorised" and no Claim owner.

## Still to do (ask me before anything that touches production)

1. **Owner access.** The only owner, `admins/Z0l8tHn15BZHUPTLKzqxguqo17k2` (grantedBy `bootstrap`,
   22 Oct), was claimed in the Claude app's built-in browser pane, whose profile is gone. Nobody can
   open the /admin dashboard. Ask me for the ID shown at https://agora-x.vercel.app/admin in my own
   browser, then (with my OK) create `admins/{that uid}` with `role` "owner", `label` "Mike (founder)",
   `grantedBy` "console", `grantedAt` now (console, or REST with the firebase-tools login), and delete
   the orphaned `admins/Z0l8…` document. See docs/SECURITY.md, "Trusted admin provisioning".
2. Then on /admin as owner: check there is no error banner, and run **Fix counts** in Events if the
   button shows (docs/SECURITY.md, "Migration and compatibility").
3. Privacy notice: docs/PRIVACY_NOTICE_DRAFT.md lists open points (controller details, legal bases,
   processors). New personal-data features stay off until `VITE_PRIVACY_NOTICE_FINAL=true` is set in
   Vercel; only flip it when the notice is final.
4. Recommended in SECURITY.md, each needing my decision: delete retired `contactKeys` (hashed
   emails/phones), restrict the Firebase web API key to our domains, Firebase App Check, an
   `npm audit fix` pass (never `--force`), removing the unused `@google/genai` dependency.
5. Optional: the flaky phone e2e page-setup timeout ([phone] e2e/profile.spec.ts:102).

## Local emulator preview (never point it at production)

1. `npx.cmd firebase emulators:start --only firestore,auth --project demo-agorax`
2. Seed: `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node --input-type=module -e "import seed from './e2e/seed.mjs'; await seed();"`
3. PowerShell: `$env:VITE_FIREBASE_EMULATORS = '1'; npx.cmd vite --port 5173 --strictPort --host 127.0.0.1`
4. Open http://127.0.0.1:5173. A plain `npm run dev` talks to the real Firebase project.
