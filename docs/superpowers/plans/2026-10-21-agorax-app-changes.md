# AgoraX App Changes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the committed validation build (`585958f`) in line with `APP_CHANGES.md` — data layer and admin first (Phases 2–3), then the screens (Phase 4) on a file structure fixed here.

**Architecture:** Most of `CLAUDE_CODE_PROMPT.md` sections 0–6 already exists in `585958f`; this plan is the delta. Visitor state moves out of `App.tsx` into a `VisitorProvider` (composition-patterns: lift state, decouple implementation, consume via `use(VisitorContext)`), so new screens live in their own files and read state from context instead of prop chains. Personal data is stored once, on `users/{uid}`; everything else (joins, helpers, proposals) references the uid.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Firebase 12 (Auth + Firestore), Tailwind v4, motion/react, lucide-react, react-router-dom 7. New: Vitest 3 (dev only).

**Spec:** `APP_CHANGES.md` (wins on conflicts), `CLAUDE_CODE_PROMPT.md` §0–6, `AGORAX_BUILD_PLAN.md` (phase order and gates), `PRODUCT.md`, `CLAUDE.md`.

## Global Constraints

- "No login screen, ever. Anonymous Firebase auth only."
- "Never double-count a participant. Everything is keyed by uid."
- "Do not take payments. Do not promise dates for events that do not exist yet." (The signup deadline "Closes 10 Nov" is shown per APP_CHANGES §4; `startTime` is never shown.)
- "src/data/seedEvents.ts is the source of truth for the 33 events. Do not invent events or change prices without being asked."
- Colours pinned: "dark navy, indigo→purple for primary actions, blue/cyan for progress, green for 'this is happening'."
- Consent text, verbatim: "We'll only use this to tell you when an event you picked is happening. Nothing else, and you can ask us to delete it any time."
- Copy: no exclamation marks, no "unlock", "seamless", "elevate", "journey", no "please", no begging.
- `App.tsx` must not grow. New screens get their own files. Target: `App.tsx` under 150 lines by the end of Phase 4.
- Every gate: `npm run lint` exit 0, `npm run build` exit 0, `npm test` 0 failures.

## Current state (verified 21 Oct 2026, commit `585958f`)

Done and staying: no login wall; one Firebase init with `getAuth(app)`; transactional `joinEvent`/`leaveEvent`; impressions via `IntersectionObserver` + `once()`; `createdAt?` on `Event`; anonymous identity + `?src=`; `seedEvents()`; analytics + counters; `/admin` with tiles, funnel, events table, sources, price answers, lists, CSV, roles; joining allowed past the minimum; price question; organiser breakdown; emoji/accent covers.

Not done (verified by grep): header copy still "…in Groningen?" / "we run it"; search is a modal, not an inline filter; chips not sticky; no tab bar (Events · Propose · My picks); no "needs 12", no "Closes 10 Nov", no "This is happening", no count-up; `🎟️` fallback emoji in `EventCover.tsx:44`; comments still in the detail view (`App.tsx:317`); banner says "Leave a number…"; organiser form lacks "Have you run something like this before?" and saves to `users.organiserEvents`, not the event; no My picks, no share link, no Propose, no proposals in admin; venue offer has no capacity and free-text type; Wallet/Stripe/"Community Karma" still in `MoreModal` (`App.tsx:946–976`); no purge; no test runner. Live site: Anonymous sign-in **disabled** (checked on https://agora-x.vercel.app at time of writing).

## File structure (whole build)

| File | Responsibility | Phase |
|---|---|---|
| `src/data/contact.ts` (new) | `normalisePhone`, `normaliseEmail`, `maskPhone` — pure, moved out of `identity.ts` | 2 |
| `src/data/dates.ts` (new) | `closesLabel(deadline, now)` | 2 |
| `src/data/share.ts` (new) | `shareCodeFor(uid)`, `buildShareUrl(origin, code, eventId)`, `resolveSource(params, stored)` | 2 |
| `src/data/purge.ts` (new) | `selectEventsToPurge(events, seedSlugs)` | 2 |
| `src/data/proposals.ts` (new) | `validateProposal`, `eventFromProposal` | 2 |
| `src/data/forms.ts` (new) | `validateHelperForm`, `validateVenueOffer` | 2 |
| `src/lib/batch.ts` (new) | `chunk(items, size)` | 2 |
| `src/services/firebaseService.ts` | + `submitHelperInterest`, `submitProposal`, venue offer v2; − `recordOrganiserInterest` | 2 |
| `src/services/identity.ts` | + `getReferrer()`; `getSource()` uses `resolveSource`; re-exports from `data/contact.ts` | 2 |
| `src/services/adminService.ts` | + `purgeNonSeedEvents`, `approveProposal`, `rejectProposal`, `subscribeHelpers` | 2–3 |
| `src/types.ts` | + `Proposal`, `HelperDoc`, `VenueOffer`, `SpaceType`, `RanBefore`; `Event.origin?` | 2 |
| `firestore.rules` | helpers, proposals, venue offer v2, editor deletes for purge, comment writes closed | 3 |
| `src/pages/admin/useAdminData.ts` (new) | all admin listeners + derived stats | 3 |
| `src/pages/admin/sections/*.tsx` (new) | `Overview`, `Funnel`, `EventsTable`, `BySource`, `PriceAnswers`, `Proposals`, `Helpers`, `SpaceOffers`, `Suggestions`, `Admins` | 3 |
| `src/pages/AdminPage.tsx` | gate + layout only (target < 120 lines) | 3 |
| `src/state/VisitorProvider.tsx` (new) | `VisitorContext` `{ state, actions, meta }` — uid, me, events, joined, pending; join/leave/open/helpRun/contact/answerPrice | 4 |
| `src/screens/EventsScreen.tsx` (new) | header, sticky chips, inline search, grid, footer links | 4 |
| `src/screens/EventDetailScreen.tsx` (new) | detail without comments | 4 |
| `src/screens/MyPicksScreen.tsx` (new) | picks, contact status, share link, empty state | 4 |
| `src/screens/ProposeScreen.tsx` (new) | one-minute proposal form | 4 |
| `src/components/TabBar.tsx` (new) | Events · (+) Propose · My picks | 4 |
| `src/components/EventCard.tsx`, `EventCover.tsx`, `OrganiserPanel.tsx`, `VenueOfferModal.tsx`, `BottomBar.tsx` | per APP_CHANGES §4, §6, §7, §10 | 4 |
| `src/legacy/LegacyViews.tsx` (new) | `AuthHero`, `CreateView`, `VenueMarketplace`, `DashboardView`, `MoreModal` moved verbatim, minus Wallet/Stripe/fake metrics (§3 keeps them, §11 removes the fake parts) | 4 |
| `src/App.tsx` | `VisitorProvider` + `TabBar` + active screen + sheets | 4 |
| `DESIGN.md` (new) | impeccable pinned tokens | 4 |

## Review Focus

1. Double tap on "I'd join", or two tabs open → count rises by exactly one. Pinned by the Phase 2 gate (real browser) and by Task 2's double-call check.
2. Purge of an event with more than 500 participant/comment docs → must not exceed Firestore's 500-writes-per-batch limit. Pinned in Task 3 (`chunk` test with 1001 items).
3. Event with a past, missing or malformed `deadline` (old docs, admin edits) → "Closed" or nothing, never "Invalid Date". Pinned in Task 8.
4. Phone typed as `06 1234 5678`, `+31 6…`, `0031 6…` → one normalised form, and My picks masks it as `+31 6…`. Pinned in Task 8.
5. A visitor opening their own share link → must not be recorded as referred by themselves. Pinned in Task 4.

---

## Phase 2 — data layer

### Task 1: Test runner and pins on existing logic

**Files:** Modify `package.json` (dev dep `vitest@^3`, script `"test": "vitest run"`). Create `src/data/progress.test.ts`, `src/data/earnings.test.ts`, `src/data/priceLadder.test.ts`, `src/lib/csv.test.ts`.

**Interfaces:** Consumes existing `remaining`, `hasEnough`, `progressLabel` (`data/progress.ts`), `earningsFor` (`data/earnings.ts`), `nextPriceFor` (`data/priceLadder.ts`), `toCsv` (`lib/csv.ts`). Produces: `npm test`.

- [ ] **Step 1: Write the tests**
  - `progressLabel({minParticipants: 12, participantsCount: 8, status: 'Pending'})` → `'8 of 12 — 4 more and this runs'`; at 12 → `hasEnough` true; `status: 'Confirmed'` at 0 → `hasEnough` true; count 15 of 12 → `remaining` 0.
  - `earningsFor(<boxing-martial-arts-intro from SEED_EVENTS>)` → `gross 144`, `platformFee` ≈ `10.08`, `costs 50`, `perHost` ≈ `83.92` (APP_CHANGES §6 example).
  - `nextPriceFor(<chess-challenge>)` → `4` (APP_CHANGES §7 "€4"); free event → `2`; result always `> price`.
  - `toCsv(['v'], [['=1+1'], ['+31612345678'], ['a,b']])` → rows `'=1+1` prefixed with `'`, phone untouched, `"a,b"` quoted.
- [ ] **Step 2:** `npm test` → all pass (these pin current behaviour; a failure here is a real bug → `systematic-debugging`).
- [ ] **Step 3: Commit** `test: add vitest and pin progress, earnings, price ladder, csv`

### Task 2: Re-verify the five §0 fixes and identity (APP_CHANGES §1)

**Files:** none unless a check fails.

- [ ] `grep -n "<AuthHero" src` → no match. `ls src/services/firebase.ts` → absent. `grep -n "getAuth(app)" src/lib/firebase.ts` → match.
- [ ] `grep -n "runTransaction" src/services/firebaseService.ts` → used by `joinEvent` and `leaveEvent`.
- [ ] `grep -n "IntersectionObserver" src/components/EventCard.tsx` → match; `grep -n "createdAt?: any" src/types.ts` → match.
- [ ] **Phase 2 gate (real Firebase — needs Anonymous sign-in enabled):** `npm run dev`, fresh browser → no sign-in screen; join an event, reload, tap join again → count +1 exactly; private window → second person (+1).

### Task 3: Purge events not in the seed list (§12, §13)

**Files:** Create `src/data/purge.ts`, `src/lib/batch.ts`, `src/data/purge.test.ts`, `src/lib/batch.test.ts`. Modify `src/services/adminService.ts`, `src/types.ts` (`Event.origin?: 'seed' | 'proposal'`).

**Interfaces:**
- Produces `selectEventsToPurge(events: Pick<Event,'id'|'origin'>[], seedSlugs: string[]): string[]`
- Produces `chunk<T>(items: T[], size: number): T[][]`
- Produces `purgeNonSeedEvents(): Promise<{ events: number; participants: number; comments: number; helpers: number }>`

- [ ] **Step 1: Tests** — `selectEventsToPurge` keeps all 33 slugs, keeps `origin: 'proposal'`, returns `'Test'`, `'jazz-xyz'`, a Cyrillic id; empty input → `[]`. `chunk(range(1001), 450)` → lengths `[450, 450, 101]`; `chunk([], 450)` → `[]`.
- [ ] **Step 2:** `npm test` → the new tests fail (functions missing).
- [ ] **Step 3:** Implement both pure functions; implement `purgeNonSeedEvents` in `adminService.ts`: for each selected id, read `participants`, `comments`, `helpers` subcollections, delete them in `chunk(…, 450)` batches, delete the event doc **last** (re-running after a partial failure finishes the job).
- [ ] **Step 4:** `npm test` → pass. Real run is checked at the Phase 3 gate (needs Task 9 rules).
- [ ] **Step 5: Commit** `feat(admin): purge events not in the seed list with their subcollections`

### Task 4: Share code and referral (§8)

**Files:** Create `src/data/share.ts`, `src/data/share.test.ts`. Modify `src/services/identity.ts` (`getSource` via `resolveSource`; new `getReferrer`; `touchUser` writes `referredBy` and `shareCode` on first creation).

**Interfaces:**
- `shareCodeFor(uid: string): string` — first 8 characters of the uid.
- `buildShareUrl(origin: string, code: string, eventId: string): string` → `${origin}/?ref=${code}&e=${eventId}`
- `resolveSource(params: URLSearchParams, stored: string | null): string` — stored wins; else clean `src`; else `'share'` if `ref` present; else `'direct'`.
- `getReferrer(): string | null` — first-touch `?ref=`, stored as `agorax_ref`, `null` when it equals the visitor's own code.

- [ ] **Step 1: Tests** — `resolveSource(new URLSearchParams('src=UB-Library!'), null)` → `'ub-library'`; `('ref=abc12345', null)` → `'share'`; `('src=x', 'poster-a')` → `'poster-a'`; `buildShareUrl('https://agora-x.vercel.app','abc12345','chess-challenge')` → `'https://agora-x.vercel.app/?ref=abc12345&e=chess-challenge'`; `shareCodeFor('4MMylJaGYTV8ZBLF')` → `'4MMylJaG'`.
- [ ] **Step 2:** `npm test` → fail. **Step 3:** implement. **Step 4:** `npm test` → pass; own-code case covered by a `getReferrer` unit around a pure `acceptReferrer(ref, ownCode)` → `null` when equal.
- [ ] **Step 5: Commit** `feat(identity): share code, first-touch referrer, 'share' source`

### Task 5: Help-run interest saved against the event (§6)

**Files:** Create `src/data/forms.ts`, `src/data/forms.test.ts`. Modify `src/services/firebaseService.ts` (add `submitHelperInterest`, remove `recordOrganiserInterest`), `src/types.ts` (`RanBefore = 'yes' | 'no' | 'sort-of'`, `HelperDoc { uid; eventId; ranBefore: RanBefore; ts }`).

**Interfaces:**
- `validateHelperForm(v: { firstName: string; phone: string; email: string; ranBefore: RanBefore | ''; consent: boolean }): string | null` — error text or null.
- `submitHelperInterest(eventId: string, uid: string, v: { firstName; phone; email; ranBefore: RanBefore }): Promise<boolean>` — transaction on `events/{eventId}/helpers/{uid}` (`{ ranBefore, ts }`); bumps `organiserInterest` only when the doc is new; then `linkContact({ name, phone, email, wantsToOrganise: true })`. Contact lives only on `users/{uid}`.

- [ ] **Step 1: Tests** — missing first name → error; phone `'0612'` → error; valid `06 12345678` without consent → error; with consent and `ranBefore: 'no'` → `null`; email optional but rejected when malformed.
- [ ] **Step 2–4:** fail → implement → pass.
- [ ] **Step 5: Commit** `feat: save help-run interest per event with ran-before answer`

### Task 6: Proposals (§9, §12)

**Files:** Create `src/data/proposals.ts`, `src/data/proposals.test.ts`. Modify `src/services/firebaseService.ts` (`submitProposal`), `src/services/adminService.ts` (`approveProposal`, `rejectProposal`), `src/services/analytics.ts` (add `'proposal_submit'`, `'share_click'` to `AnalyticsName`), `src/types.ts` (`Proposal { id; uid; title; category; price; minPeople; needs; status: 'new' | 'approved' | 'rejected'; eventId?; source; ts }`, `Event.proposalId?: string`).

**Interfaces:**
- `validateProposal(p: { title; category; price; minPeople; firstName; phone; needs; consent }): string | null` — title 3–120 chars, price 0–200, minPeople 2–200, phone ≥ 8 digits, consent required.
- `eventFromProposal(p: Proposal, now: number): EventFormData & { origin: 'proposal'; proposalId: string }` — `status 'Pending'`, `minParticipants = minPeople`, `description = title`, `emoji '💡'`, default accent `#818cf8`, `hostsNeeded 1`, costs 0, `deadline` +21 days, `startTime` +28 days, `imageUrls []`.
- `submitProposal(input): Promise<void>` — writes `proposals/{autoId}` without contact fields; contact goes through `linkContact`.
- `approveProposal(p: Proposal): Promise<string>` (new event id) — batch: create event + set proposal `status 'approved'`, `eventId`. `rejectProposal(id: string): Promise<void>`.

- [ ] **Step 1: Tests** — `validateProposal` bounds above; `eventFromProposal` maps fields, never sets `participantsCount` above 0, `origin === 'proposal'`, deadline exactly 21 days after `now`.
- [ ] **Step 2–4:** fail → implement → pass.
- [ ] **Step 5: Commit** `feat: proposals that become events only when an admin approves`

### Task 7: "I have a space" v2 (§10)

**Files:** Modify `src/services/firebaseService.ts` (`submitVenueOffer`), `src/data/forms.ts`, `src/data/forms.test.ts`, `src/types.ts` (`SpaceType = 'room' | 'hall' | 'cafe' | 'other'`).

**Interfaces:** `validateVenueOffer(v: { name; spaceType: SpaceType | ''; capacity: string; contact; consent }): string | null`; `submitVenueOffer({ name, spaceType, capacity: number, contact })`.

- [ ] **Step 1: Tests** — capacity `'0'`, `'abc'`, `'6000'` → error; `'40'` ok; missing type → error; no consent → error.
- [ ] **Step 2–4:** fail → implement → pass. **Step 5: Commit** `feat: space offers record type and capacity`

### Task 8: Date and contact display helpers (§4, §8)

**Files:** Create `src/data/dates.ts`, `src/data/dates.test.ts`, `src/data/contact.ts`, `src/data/contact.test.ts`. Modify `src/services/identity.ts` to import/re-export from `data/contact.ts`.

**Interfaces:** `closesLabel(deadline: string | undefined, now: Date): string`; `maskPhone(phone: string): string`; `normalisePhone`, `normaliseEmail` (moved, unchanged).

- [ ] **Step 1: Tests** — `closesLabel('2026-11-10T12:00:00', new Date('2026-10-21T12:00:00'))` → `'Closes 10 Nov'`; deadline before now → `'Closed'`; `undefined` and `'not a date'` → `''`. Month names from a fixed array (ICU gives "Sept" in en-GB). `normalisePhone('06 1234 5678')`, `('+31 6 1234 5678')`, `('0031612345678')` → `'+31612345678'`; `maskPhone('+31612345678')` → `'+31 6…'`; `maskPhone('+4915112345678')` → `'+49 1…'`.
- [ ] **Step 2–4:** fail → implement → pass. **Step 5: Commit** `feat: closing-date label and phone masking helpers`

**Phase 2 gate:** `npm test`, `npm run lint`, `npm run build` all exit 0; Task 2's real-browser check passes (blocked until Anonymous sign-in is enabled — see Open decisions).

---

## Phase 3 — admin and rules

### Task 9: Firestore rules v2

**Files:** Modify `firestore.rules`. Create `docs/superpowers/reviews/2026-10-21-rules-cases.md` (case table).

Changes on top of the current rules:
- `events/{id}/helpers/{uid}`: create/update only own uid, keys `hasOnly(['ranBefore','ts'])`, `ranBefore in ['yes','no','sort-of']`, `ts == request.time`; read own or admin; `delete` own or editor. Collection-group read for admins.
- `proposals/{id}`: create when `uid == auth.uid`, `status == 'new'`, size limits from Task 6; read and update editors only; no delete.
- `venueOffers`: `spaceType in ['room','hall','cafe','other']`, `capacity is int` 1–5000.
- Editors may delete `participants` and `comments` docs (purge).
- Comments: `create` removed (APP_CHANGES §5 closes that write surface); read stays for admins only.
- `users/{uid}`: own uid may set `shareCode`, `referredBy`; nothing else changes.

- [ ] **Step 1:** Write the case table (actor × path × op → allow/deny), at least: anonymous joins own uid ✔; joins as another uid ✘; counter +2 ✘; editor purges participants ✔; viewer purges ✘; proposal with `status 'approved'` from a visitor ✘; visitor reads proposals ✘; visitor creates comment ✘; helper doc with an extra field ✘.
- [ ] **Step 2:** Run the cases — emulator tests if Java is available (see Open decisions), otherwise the founder runs them in the console's Rules Playground from the table.
- [ ] **Step 3:** `security-review` and `gdpr-data-handling` over the rules + forms; findings in `docs/superpowers/reviews/2026-10-21-security-gdpr.md`; every high finding fixed or listed as open.
- [ ] **Step 4: Commit** `feat(rules): helpers, proposals, space offers v2, admin purge, close comment writes`

### Task 10: Split the admin page

**Files:** Create `src/pages/admin/useAdminData.ts`, `src/pages/admin/sections/{Overview,Funnel,EventsTable,BySource,PriceAnswers,Proposals,Helpers,SpaceOffers,Suggestions,Admins}.tsx`. Modify `src/pages/AdminPage.tsx`.

**Interfaces:** `useAdminData(): { events; users; participants; helpers; proposals; suggestions; venueOffers; admins; stats; errors; addError }`. Sections take only what they render plus `canEdit` / `isOwner`.

- [ ] Move code without behaviour change. **Check:** `npm run lint`, `npm run build`; same admin walkthrough as before (tiles, funnel, table, CSV) gives the same numbers.
- [ ] **Commit** `refactor(admin): split page into data hook and sections`

### Task 11: Admin additions (§12)

**Files:** `src/pages/admin/sections/*`, `src/pages/admin/EventEditor.tsx`.

- [ ] Tiles exactly: visitors, total joins, people who joined, contacts left, avg picks, help-run taps, space offers, proposals.
- [ ] Events table: clicking a row opens the editor; "Remove events not in the list" button → confirm → `purgeNonSeedEvents()` → shows the four counts.
- [ ] Proposals list with Approve (→ `approveProposal`, shows new event id) and Reject; proposer name/WhatsApp joined from `users`.
- [ ] Helpers list from `subscribeHelpers()` joined with `users` (name, WhatsApp, email) + event + ran-before answer; CSV.
- [ ] Space offers show type and capacity; CSV.
- [ ] Editor: `🎟️` fallback replaced by `💡`.
- [ ] **Commit** `feat(admin): proposals, purge, helpers, row editing`

**Phase 3 gate:** non-admin on `/admin` sees "Not authorised" and their uid; an admin can purge (events count becomes 33), seed, edit any field, export CSV; no unresolved high security finding; lint, build, tests exit 0.

---

## Phases 4–7 (planned in detail after the Phase 4 design brief)

- **Phase 4 (§2–11, §14):** `impeccable document` → `DESIGN.md`; `critique`; `shape` (brief covers default / joined / close to minimum / running — **stop and show the brief**); then build APP_CHANGES §2–11 into the files listed above, `animate`, `adapt` at 390px → tablet → desktop. Each screen is its own task with a lint/build check and a browser check at 390px. `VisitorProvider` opens the event named by `?e=` (from a share link) once events load.
- **Phase 5:** `humanizer` + `avoid-ai-writing` over every student-facing string; `grep -rn "!"` in JSX text and the banned-word list → 0 hits.
- **Phase 6:** `impeccable polish` + `audit`; full walkthrough with `?src=test-poster` ending in admin showing it under that source.
- **Phase 7:** `deploy-to-vercel`; confirm Anonymous sign-in and the production domain in Firebase authorised domains; check on a phone over mobile data.

## Open decisions (need the founder)

1. **Anonymous sign-in is still off** on the Firebase project. The Phase 2 gate cannot pass on real Firebase until it is switched on (Authentication → Sign-in method → Anonymous).
2. **Rules testing:** Java is not installed, so the Firestore emulator cannot run. Install Eclipse Temurin JDK 21 and I'll run the Task 9 cases as automated tests, or I hand you the case table for the Rules Playground.
3. **Deletion contact:** the consent text promises deletion on request. Students need somewhere to ask — which email or WhatsApp number should the page show?
4. **Purge keeps approved proposals** (`origin: 'proposal'`), otherwise "Remove events not in the list" would delete events you approved. Confirm.

## Conflicts resolved in this plan

- Dates: CLAUDE_CODE_PROMPT says no dates; APP_CHANGES §4 shows the signup deadline. The deadline is shown, the event `startTime` never is.
- §3 keeps the old components; §11 removes the fake Wallet/Stripe/metrics. Old components move to `src/legacy/` with the fake parts deleted.
- The suggestion box is not in APP_CHANGES' screens but §12 lists suggestions; it stays in the feed footer.
