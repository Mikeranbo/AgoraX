# AgoraX security notes

Status: changes on branch `security-fixes`, **not deployed**. Nothing here has been run against
production. `firestore.rules` and `npm run test:rules` are the source of truth.

## What changed (2026-10-23)

| Weakness found | Fix |
| --- | --- |
| Any visitor could claim the owner seat while `meta/bootstrap` did not exist, then read every contact detail | Self-service claim removed from the rules and the admin page. Owners are provisioned by hand (below). |
| `contactKeys` (unsalted SHA-256 of email/phone → uid) readable one key at a time, and claimable by anyone | No reads, no new keys. A person can still delete keys that point at their own uid (erasure). The client no longer writes them. |
| `mergeRequests` written from a typed email/phone or a browser-reported uid | No new merge requests; the client no longer writes them. Old ones stay readable by editors. |
| `participantsCount` / `organiserInterest` inflatable by join→leave-without-decrement loops | Joining/leaving and offering/withdrawing must move the counter by exactly ±1 **in the same write** as the document it counts. A drifted counter at 0 may stay at 0 on leave. |
| `impressions` / `opens` incrementable without limit | Analytics only: +1 once per visitor per event, tied to `events/{id}/seen/{uid}`, never in the same write as a participation change. |
| `admins` listable by any visitor (uids + names) | Everyone may read only their own admin doc; owners list/grant/revoke others, never themselves. |
| Viewers could read all contact details | `users/*` readable by the person themself, editors and owners only. |
| Loose schemas (`users`, `analytics`, `admins`, participants) | Field allowlists, type and length checks, server timestamps, set-once `shareCode`/`referredBy`, known analytics names and payload keys. Only fields a write changes are checked, so older documents keep working. |
| `npm run test:rules` could not run (`firebase-tools: not found`) | `firebase-tools` pinned as a devDependency; tests use the `demo-agorax` project id, so the emulator can never reach the real project. |

## Trusted admin provisioning

Admin rights come from `admins/{uid}`. The rules never let a visitor create or change their own
admin document, so the **first owner can only be created by someone with access to the Firebase
project** (console or Admin SDK, which bypass the rules).

1. The new owner opens `https://<site>/admin` in the browser profile they will use for admin work
   and copies the uid shown on the **Not authorised** page.
2. A project member with Firestore write access (Firebase console → Firestore Database → Data)
   creates `admins/{that uid}` with exactly these fields:
   `role` (string) `owner`, `label` (string) a short name, `grantedBy` (string) `console`,
   `grantedAt` (timestamp) now. Nothing else.
3. Reload `/admin`. Further admins are granted from the **Admins** section by an owner. The rules
   check the role (`owner` / `editor` / `viewer`), that `grantedBy` is the granting owner and that
   the owner is not editing their own entry.
4. To remove an owner's own entry or change it, use the console. This is deliberate: an owner
   cannot lock the project out by accident, and a hijacked owner session cannot rewrite itself.

The uid belongs to a browser profile (anonymous auth). Clearing site data creates a new uid: grant
the new uid, then revoke the old one.

## Checking the production bootstrap state (read-only, no contact details)

The old rules opened a public "Claim owner" button on `/admin` whenever `meta/bootstrap` did not
exist. The README's setup steps created the first admin by hand **without** creating
`meta/bootstrap`, so the seat may be open right now. Check before anything else:

1. Sign in to <https://console.firebase.google.com/> with a project member account and open
   project `agorax-a8d07`.
2. Open the single document directly (this does not load the `users` collection):
   <https://console.firebase.google.com/project/agorax-a8d07/firestore/databases/-default-/data/~2Fmeta~2Fbootstrap>
   Do **not** click into `users`, `contactKeys` or `analytics`.
3. Read the result:
   - **Document does not exist:** the claim seat is open under the rules currently deployed.
     Anyone who visits `/admin` sees **Claim owner**. Deploy the new rules (step 3 of the
     deployment plan) as soon as possible. If you need to close it sooner, creating
     `meta/bootstrap` by hand (`claimedBy` = `console-lock`, `ts` = now) closes it under the old
     rules and is ignored by the new ones. That is a production write, so it is your call.
   - **Document exists:** note `claimedBy` and `ts`. `claimedBy` should be a uid you recognise.
4. Open the `admins` collection (it only holds `role`, `label`, `grantedBy`, `grantedAt`). For each
   document, the id is a uid. Red flags:
   - a uid you do not recognise;
   - `grantedBy` = `bootstrap` on a uid that is not yours;
   - `grantedBy` pointing at a uid that is not a known owner;
   - `meta/bootstrap.claimedBy` not matching any owner you created.
5. Command-line alternative (needs `gcloud` signed in as a project member). It reads only the two
   paths and leaves out labels:

   ```bash
   TOKEN=$(gcloud auth print-access-token)
   BASE="https://firestore.googleapis.com/v1/projects/agorax-a8d07/databases/(default)/documents"
   curl -s -H "Authorization: Bearer $TOKEN" "$BASE/meta/bootstrap"
   curl -s -H "Authorization: Bearer $TOKEN" "$BASE/admins?pageSize=100&mask.fieldPaths=role&mask.fieldPaths=grantedBy&mask.fieldPaths=grantedAt"
   ```

**If you find a red flag:** take screenshots of `meta/bootstrap` and `admins` first. Deploy the new
rules, then delete the unknown admin documents in the console. Treat it as a possible personal-data
breach: an unknown owner could have read every `users` document (names, emails, phone numbers).
Under GDPR Art. 33 you must assess within 72 hours whether to notify the Autoriteit
Persoonsgegevens. Firestore data-access audit logs are off by default, so you probably cannot tell
what was read.

## Migration and compatibility

- **No data migration is required.** Existing documents are untouched. The rules only check fields
  a write changes, so older `users` documents keep working.
- **Inflated counters:** after deploying, an editor or owner opens `/admin`. If any event's
  `participantsCount`, `joins` or `organiserInterest` differs from its real participant/helper
  documents, a **Fix counts (N)** button appears in Events. It lists the corrections and asks
  before writing. Run it when nobody is joining; re-run it if in doubt.
- **The admin dashboard now counts host interest from helper documents**, the same way joins are
  counted. Public cards still show `participantsCount`, which the fix above corrects.
- **`impressions` / `opens` now mean "visitors who saw / opened"**, once per visitor per event,
  going forward. Before, they were "sessions". Older totals are not comparable.
- **Price answers** now also write `lastPriceAnswer` (the event id) so the rules can check the
  single entry that changed.
- **Viewers** no longer load `users` or `admins`. Their dashboard shows a notice and no names,
  contact details, visitor counts or price answers.
- **Retired data left in place:** `meta/bootstrap`, `contactKeys`, `mergeRequests`. Decision for
  you: `contactKeys` hold hashes of emails/phones (personal data) and no longer serve any purpose.
  Deleting them (console or Admin SDK) is recommended under storage limitation. Not done.
- **Deploy window:** old cached clients keep running until they reload. Under the new rules their
  price answers and view counts are refused. They fail silently, with no visible error. The new
  client under the old rules has the same two gaps. Joins, leaves, contact details, proposals,
  suggestions and space offers work under both, which is why the order below is rules first,
  frontend straight after.

## Production deployment plan (not executed — needs your approval)

1. **Check bootstrap state** (section above). If the seat is open, move fast on step 3.
2. **Review and merge** `security-fixes` into `main` through a pull request. Before merging, run
   `npm ci && npm run lint && npm run build && npm test && npm run test:rules` (needs JDK 21+).
3. **Deploy the rules:** `npx firebase login` as a project member, then
   `npx firebase deploy --only firestore:rules --project agorax-a8d07`. The app uses the
   `(default)` database, which is what this deploys to. Or paste `firestore.rules` into
   Firebase console → Firestore Database → Rules → Publish.
4. **Deploy the frontend right after** (Vercel production deployment of the merged `main`).
5. **Smoke test** on the live site, on a phone and a laptop:
   - Join, leave and rejoin an event: the count goes up 1, down 1, up 1.
   - Contact banner saves; delete my details works.
   - Price ladder answer saves.
   - `/admin` as owner: Admins section visible, no error banner.
   - `/admin` as viewer (if you have one): notice shown, no error banner.
   - `/admin` in a fresh private window: Not authorised, no Claim owner button.
6. **Fix counts** from `/admin` → Events if the button shows.
7. **Watch** the Firestore usage dashboard and browser console for `permission-denied` spikes for
   a day.

**Rollback:** Firebase console → Firestore → Rules keeps previous versions (restoring one re-opens
the holes, so only do it if the site is broken), and Vercel has instant rollback to the previous
deployment.

## Account linking (disabled until verified)

Two uids may only be treated as one person after ownership is proven:

- **Same uid, upgraded:** Firebase Auth email-link or phone verification plus `linkWithCredential`
  (`upgradeAnonymousAccount` in `src/services/identity.ts`, not wired to any UI) keeps the uid.
  It needs no backend.
- **Merging two existing uids** needs a trusted backend (for example a Cloud Function using the
  Admin SDK, which needs the Blaze plan). It must verify that the caller controls both uids, for
  example a verified email on each, then move the data. Until that exists there is no merge flow.

## Remaining risks

- **Many identities per person.** Anonymous auth lets one person make many uids (private window,
  another browser). Counts are unique uids, not unique people. Mitigation: Firebase App Check
  (reCAPTCHA) enforced for Firestore, plus watching joins per source on `/admin`. Needs console
  setup.
- **Admin access is tied to an anonymous browser profile.** Anyone with that profile is admin.
  Consider Google sign-in for admins only (not for students).
- **No rate limits.** Rules cannot rate-limit, so `analytics`, `suggestions` and `proposals` can be
  spammed. Each document is bounded in size, but volume and cost are not. App Check helps.
- **Partial validation.** `users.joinedEvents` is bounded to 100 entries, but its entries are not
  type-checked. `priceAnswers` entries are checked when written, not retroactively.
- **Initials are visible to every signed-in visitor**, together with the uid. This is opt-in.
- **Public Firebase web API key:** restrict it in Google Cloud console → APIs & Services →
  Credentials. Allow HTTP referrers for your domains only, and only the Identity Toolkit and Cloud
  Firestore APIs.
- **`GEMINI_API_KEY`:** `vite.config.ts` would inline it into the public bundle if code ever used
  it. Nothing does today.

## npm audit triage (2026-10-23)

The shipped browser bundle contains only these packages (checked with a Vite build that lists
every bundled module): `@firebase/{app,auth,component,firestore,logger,util,webchannel-wrapper}`,
`firebase`, `framer-motion`, `motion-dom`, `motion-utils`, `idb`, `lucide-react`, `react`,
`react-dom`, `react-router`, `scheduler`. **None of the flagged packages is in it.**

| Findings | Where they come from | Exposure |
| --- | --- | --- |
| `vite` (high) | dev server / build | Dev server only: Windows path tricks, NTLM via `launch-editor`. Production serves static files from Vercel. An in-range fix exists. |
| `postcss`, `nanoid`, `source-map-js`, `browserslist`, `baseline-browser-mapping`, `@babel/core` | build toolchain | Build time only, processing our own source. In-range fixes exist. |
| `vitest`, `tinypool`, `@vitest/mocker` (critical/moderate) | test runner | Local/CI tests only. The fix is vitest 5, a major upgrade. |
| `websocket-driver` (critical) | `firebase` → `@firebase/database` → `faye-websocket` | Node build of Realtime Database only. Not used by the app and not in the bundle. |
| `protobufjs` | `@google/genai` (unused dependency), `firebase-tools` | Not in the bundle. Removing `@google/genai` drops one path. |
| `@grpc/grpc-js`, `@google-cloud/pubsub`, `@opentelemetry/core`, `gaxios`, `uuid`, `re2`, `firebase-tools` | `firebase-tools` (new devDependency for the emulator) | Developer machine / CI only. The suggested "fix" is a downgrade to 14.x. Not taken. |

Recommendation: a separate change running `npm audit fix` (without `--force`) for the in-range
updates. It rewrites much of the lockfile, so re-run lint/build/tests after. Then remove the unused
`@google/genai` dependency, and plan the vitest major upgrade on its own. Never `--force`.

## Running the rules tests

```bash
npm ci
npm run test:rules   # needs JDK 21+; first run downloads the Firestore emulator
```

It starts the Firestore emulator for the `demo-agorax` project and runs:
- `scripts/test-rules.mjs`: every confirmed attack, written straight against the SDK (no UI), and
  the legitimate flows, against `firestore.rules`.
- `src/services/clientFlows.emulator.test.ts`: the app's real service functions (join, leave,
  helper offers, price answers, view counters, contact/consent/erasure, proposals, admin grants,
  seed, fix counts, purge) against the same rules. Plain `npm test` skips it.

## Pilot UX additions (branch `pilot-ux`, on top of `security-fixes`)

- **Public profiles** live in `profiles/{publicId}`. `publicId` is 20 random characters, never the
  uid, so a profile can't be joined to anything keyed by uid (initials, participants). Ownership
  is recorded in write-only `profileOwners/{publicId}`; `users/{uid}.publicId` (private) can only
  point at an id that user claimed. Profiles accept only `data:image/jpeg|webp` pictures within
  fixed sizes (no links, no SVG) and have no `verified` or `registered` fields.
- **Organiser mode** (`users.mode`: attend / organise / both) is a private preference. It unlocks
  drafts and an organiser identity, never admin rights; admin access is still only via `admins/{uid}`.
- **Proposals**: the author can read their own, edit and delete drafts, and send once; after that
  only editors change them. A proposal can only name the author's own public profile.
- **New private fields** on `users/{uid}`: `savedEvents`, `preferredTiming`, `mode`, `publicId`,
  and consent purposes `launch` and `invites` (each consent also stores the notice version).
- **Privacy gate**: `VITE_PRIVACY_NOTICE_FINAL` (default off) keeps public profiles, organiser
  identity and the launch/invitation opt-ins out of the build until the notice is final. The rules
  already allow them; the client does not offer them.
- **Deletion**: "Delete my data and account" (`src/services/accountService.ts`) withdraws interests
  and helper offers through the rule-checked paths, deletes drafts, the profile and the `users`
  doc, then the anonymous account.

Deploying `pilot-ux` follows the same plan as above (rules first, frontend right after). Extra
points:
- No indexes needed: the only new query, proposals `where uid == me`, uses the automatic
  single-field index.
- No Firebase Storage and no paid plan: pictures are compressed in the browser and stored in the
  Firestore document.
- No migration: existing users, venue offers and proposals keep working. Existing events keep
  their stored (placeholder) dates; they only show once an admin ticks "Date confirmed".
- `firebase.json` now also lists the Auth emulator (port 9099) for `npm run test:e2e`.
