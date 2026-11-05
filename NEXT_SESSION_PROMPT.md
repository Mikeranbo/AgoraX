# Prompt for the next Claude Code session

Project: `D:\proects\work\agora x\code\code 3` (github.com/Mikeranbo/AgoraX). Firebase project
`agorax-a8d07`, Vercel deploys `main` to https://agora-x.vercel.app.

## State on 5 Nov 2026

- Live database matches `src/data/seedEvents.ts`: the 10 events that left the list (bouldering, padel,
  boxing, fencing, basketball, ping-pong, swim & sauna, running, video games, cycling) were removed
  with their 6 sign-ups via /admin, and the seed wrote 17 new + 23 refreshed = 40 events. A read-only
  backup from before is in `..\backups\firestore-events-before-40-2026-11-05.json`.
- Admins: `0iWlXrItViTi0MWyWvJOLaApjfG3` owner "Mike (founder)"; `LUhMLDBO3CP0OsuSGlpUCUyNTqM2` editor
  "Claude (co-founder)" (the Claude desktop browser pane, granted from the console).
- Storage: default bucket `agorax-a8d07.firebasestorage.app` (europe-west4). The Storage service
  agent has the "Firebase Rules Firestore Service Agent" role (granted in Cloud Console, 5 Nov).
  `storage.rules` allow editors and the event's organiser to upload photos (jpeg/png/webp, 10 MB)
  and videos (mp4/webm, 50 MB) to `events/<id>/`; only editors delete. Gallery photos from the device
  are scaled to 2000 px and saved as JPEG (no camera metadata) before upload. Tested live as the
  editor on 5 Nov: photo and video uploaded, shown on Photo Walk & Share, then deleted; a GIF is refused.
- Event page: Meetup-style two columns on wide screens (sticky sign-up card on the right), header
  edge to edge; the footer is a full-width band on every screen.

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

1. **Owner access: done (24 Oct).** `admins/0iWlXrItViTi0MWyWvJOLaApjfG3` (my own browser,
   `grantedBy` "console") is the only owner; I confirmed /admin works. The orphaned Claude-pane owner
   `admins/Z0l8tHn15BZHUPTLKzqxguqo17k2` (grantedBy `bootstrap`, 22 Oct) was deleted; its Auth user
   and other records were left alone.
2. **Fix counts** is a separate step: only when I ask, on /admin → Events, if the button shows
   (docs/SECURITY.md, "Migration and compatibility"). Not run yet.
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
