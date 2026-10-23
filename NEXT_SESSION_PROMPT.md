# Prompt for the next Claude Code session (paste this when usage resets)

Project: `D:\proects\work\agora x\code\code 3` (github.com/Mikeranbo/AgoraX). Firebase project
`agorax-a8d07`, Vercel deploys `main` to https://agora-x.vercel.app.

## State on 23 Oct 2026

- Commit `ec69644` ("Harden Firestore rules and ship the pilot UX", from
  `agorax-completed-work.zip`) is integrated by fast-forward on top of `d544e52` and pushed to the
  branch **`pilot-security-ux`**, NOT to `main`. GitHub `main` and the live site still run `d544e52`
  with the old Firestore rules.
- Backup of the pre-integration state: `D:\proects\work\agora x\code\backups\code3-before-ec69644-2026-10-23\`
  (full-history `repo-all-refs.bundle` + `working-tree.tgz`) and local branch `backup/before-ec69644`.
  Keep it.
- The ZIP had no HANDOFF.md; the commit message, `docs/SECURITY.md` and `docs/PRIVACY_NOTICE_DRAFT.md`
  are the hand-off notes.

## Test results for ec69644 (local, emulator-only)

- `npm run lint`: passes. `npm run build`: passes.
- `npm test`: 109 passed, 16 skipped, 1 failed: `src/data/privacyNotice.test.ts` fails only because
  `core.autocrlf=true` checks `docs/PRIVACY_NOTICE_DRAFT.md` out with CRLF; it passes with LF.
- `npm run test:rules` (Java 21 needed, demo-agorax): 189/189 rule checks + 16/16 client-flow tests.
- `npm run test:e2e` with `PW_CHROMIUM_PATH` = local Chrome: 47 passed, 4 skipped (device-specific),
  1 failed on a 60 s page-setup timeout ([phone] profile.spec.ts:102), which passed on rerun.
- `npm ci` printed allow-scripts warnings (esbuild, protobufjs, re2 install scripts not run);
  everything still worked.

## Still to do (ask me before anything that touches production)

1. Fix the CRLF test failure: add a `.gitattributes` (e.g. `*.md text eol=lf`, `*.ts text eol=lf`)
   or normalise `\r\n` in `privacyNotice.test.ts`, then re-run `npm test`.
2. Read `docs/SECURITY.md`, then with my OK deploy the new rules first:
   `npx firebase deploy --only firestore:rules --project agorax-a8d07`. There is no "Claim owner"
   button any more; check that my existing `admins/{uid}` owner document still satisfies the new
   admins schema, or provision it by hand as SECURITY.md describes.
3. Only after the rules are live, and with my OK: merge `pilot-security-ux` into `main` and push
   (that deploys the frontend on Vercel). Then check https://agora-x.vercel.app and /admin.
4. Privacy notice: `docs/PRIVACY_NOTICE_DRAFT.md` lists open points (controller details, legal
   bases, processors). New personal-data features stay off until `VITE_PRIVACY_NOTICE_FINAL=true`
   is set in Vercel; only flip it when the notice is final.
5. Optional: look at the flaky phone e2e page-setup timeout.

## Local emulator preview (never point it at production)

1. `npx.cmd firebase emulators:start --only firestore,auth --project demo-agorax`
2. Seed: `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node --input-type=module -e "import seed from './e2e/seed.mjs'; await seed();"`
3. PowerShell: `$env:VITE_FIREBASE_EMULATORS = '1'; npx.cmd vite --port 5173 --strictPort --host 127.0.0.1`
4. Open http://127.0.0.1:5173. A plain `npm run dev` would talk to the real Firebase project.
