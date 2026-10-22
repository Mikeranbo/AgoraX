# AgoraX — build plan for the validation landing page

Read this, `PRODUCT.md`, `CLAUDE.md`, `APP_CHANGES.md` and `CLAUDE_CODE_PROMPT.md` before starting.
`APP_CHANGES.md` is the exact screen-by-screen list of changes and wins over
`CLAUDE_CODE_PROMPT.md` where they differ. This file is the
order of work and which skill drives each phase.

## The result we are working towards

Not a beautiful app. A working instrument that answers one question:
**which niche events will Groningen students actually sign up for, and who will
run them?**

Concretely, within 3–4 weeks of the posters going up:

- 200+ visits from QR codes, traceable per poster location
- 40%+ of visitors pick at least one event
- 15%+ leave a WhatsApp number or email
- 5+ different events with 20+ people each
- 5+ people tap "help run this" or "I have a space"

Then the founder runs the top 2–3 events by hand. 30%+ of people who signed up
turning up is the number that goes into the Innokite application and the first
investor conversation.

Everything below serves that. If a task does not move one of those numbers or
protect the data behind them, it is out of scope.

## Out of scope for this build — do not build

Payments and refunds. The full "Create Event" form (replaced by the short
Propose form in APP_CHANGES.md section 9). The venue marketplace. Comments.
Paid promotion. Notifications. Login screens. Any new event beyond
the 33 in `src/data/seedEvents.ts`.

## Phases, in order

Each phase ends with its gate. Do not start the next phase until the gate passes.

### Phase 1 — Plan the code work
**Skills:** `writing-plans`

Write the implementation plan for sections 0, 1, 2, 4, 5 and 6 of
`CLAUDE_CODE_PROMPT.md` (bug fixes, anonymous identity, seeding, admin,
analytics, Firestore rules). Section 3, the landing page design, is Phase 4 —
leave it out of this plan. Save it under `docs/superpowers/plans/`.

**Gate:** plan saved, every task names its files and how it will be checked.

### Phase 2 — Fix and clean the data layer
**Skills:** `executing-plans`, `systematic-debugging` for anything that fails

Work through the plan task by task. In this order:

1. The five existing bugs: login wall at `App.tsx` ~line 1125, the duplicate
   Firebase init in `src/services/firebase.ts`, double counting in `joinEvent`,
   impressions firing on every render, `createdAt` missing from the type.
2. Anonymous identity and uid-keyed joins.
3. `purgeNonSeedEvents()` and `seedEvents()`. Old test events — "Watercolor
   Basics Workshop", "Jazz Under the Stars", "Test", "Test event",
   "Муравьиный бой", "Дд" and anything else not in the seed list — must be
   deletable, including their `participants` and `comments` subcollections.
4. Analytics service and per-event counters.

**Gate:** with the dev server running, open the app in a fresh browser — no
sign-in screen; join an event, reload, join again — count goes up by exactly
one; open a private window — that counts as a second person.

### Phase 3 — Admin and rules
**Skills:** `executing-plans`, `security-review`, `gdpr-data-handling`

Build `/admin` exactly as APP_CHANGES.md section 12 describes, and rewrite
`firestore.rules` as specified. Run
`security-review` against the rules. Run `gdpr-data-handling` against the
contact capture, the consent text, what is stored and how a student would ask
for deletion.

**Gate:** a non-admin visiting `/admin` sees "Not authorised" and their uid; an
admin can purge, seed, edit any field of any event and export CSV; the security
review has no unresolved high findings.

### Phase 4 — Design the landing page
**Skills:** `impeccable` (mode: Persuade), `interaction-design`,
`responsive-design`, `tailwind-design-system`

Do NOT use `brand-landingpage`: it requires Google Stitch and its own
description says to skip it when restyling with known tokens, which is this
case.

Run impeccable in this order:

1. `impeccable document` — record the current palette into DESIGN.md as
   pinned tokens. PRODUCT.md already exists; do not rerun `init`.
2. `impeccable critique` on the current feed, so the problems are named, not
   guessed.
3. `impeccable shape` for the feed. PRODUCT.md answers the discovery questions;
   only confirm the brief. The brief must cover the four card states: default,
   joined, close to its minimum, and running.
4. Implement it. Follow `reference/craft-floor.md` before editing UI.
5. `impeccable animate` — the count, the bar filling on scroll into view, the
   card's state change when the minimum is reached, the join tap. Use
   `interaction-design` for these microinteractions.
6. `impeccable adapt` at 390px first, then tablet and desktop.

The palette is pinned. PRODUCT.md's Brand Commitments override any instinct to
change colours. Redesign everything else.

Build every screen in APP_CHANGES.md sections 2–11.

**Gate:** screenshot at 390px and 1280px; no two adjacent cards look the same;
progress is the most visible element on every card; every item in
APP_CHANGES.md sections 2–11 is done or explicitly reported as not done.

### Phase 5 — Words
**Skills:** `humanizer`, `avoid-ai-writing`

Run both over every string a student will read: header, card copy, buttons,
the organiser panel, the price question, the contact banner, the consent text,
empty and error states. Voice rules are in PRODUCT.md.

**Gate:** no exclamation marks, no "unlock", "seamless", "elevate", "journey",
no begging.

### Phase 6 — Verify and polish
**Skills:** `impeccable polish`, `impeccable audit`,
`verification-before-completion`

`npm run lint`, `npm run build`, then walk the full path by hand: scan-style
visit with `?src=test-poster` → filter → open a card → join → price question →
contact → help-run-this → admin shows all of it under source `test-poster`.

**Gate:** everything above works and the build passes. Report what was checked,
not just that it was.

### Phase 7 — Ship
**Skills:** `deploy-to-vercel`

Deploy. Confirm Anonymous sign-in is enabled in the Firebase project and the
production domain is in Firebase's authorised domains.

**Gate:** the production URL works on a phone over mobile data.

## Manual steps for the founder

- Enable Anonymous sign-in in Firebase Console → Authentication.
- After Phase 3, open `/admin`, copy the uid shown, and create
  `admins/{that uid}` with `role: "owner"` in Firestore.
- Then use the admin page to purge old events and seed the 33.
