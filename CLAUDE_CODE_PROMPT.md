# Claude Code prompt — AgoraX demand-validation build

> **Superseded in part (2026-10-23, see `docs/SECURITY.md`).** Do not re-implement these parts of
> the spec below: `mergeRequests` written from a matching email/phone or a stored `agorax_uid`;
> `contactKeys` lookups; "any signed-in user may change the counter fields"; `admins` readable by
> any signed-in user. They allowed account confusion, a contact-hash oracle, counter inflation and
> admin enumeration. `firestore.rules` and `npm run test:rules` are the source of truth.

Paste everything below the line into Claude Code, from inside `code/code 3`.

---

You are working on AgoraX: React 19 + TypeScript + Vite 6, Firebase (Auth + Firestore),
Tailwind v4, `motion/react`, `lucide-react`. Entry point `src/main.tsx` → `src/App.tsx`.

The goal of this change is to turn the app into a **demand-validation landing page** that
students reach by scanning a QR code on posters around the University of Groningen. They must
be able to browse events and register interest **without ever creating an account**, and the
same person must never be counted twice.

Read `src/App.tsx`, `src/services/firebaseService.ts`, `src/components/EventCard.tsx`,
`src/types.ts`, `src/lib/firebase.ts` and `firestore.rules` before starting. Keep the existing
dark visual style (`glass` class, `brand-primary`, rounded-3xl cards) throughout.

## 0. Fix these existing problems first

1. **`src/App.tsx` line ~1125 has `if (!user) return <AuthHero />;`** — a hard login wall in
   front of the whole app. Remove it. `AuthHero` must no longer be rendered anywhere; leave
   the component in the file but unused, or delete it. Nobody signs in with a password now.
2. **There are two Firebase initialisations.** `src/lib/firebase.ts` initialises from
   `firebase-applet-config.json`; `src/services/firebase.ts` initialises a *second* app from
   `import.meta.env.VITE_FIREBASE_*` and is not imported by `App.tsx`. Delete
   `src/services/firebase.ts` entirely. In `src/lib/firebase.ts`, change `getAuth()` to
   `getAuth(app)` so it is bound to the right app explicitly.
3. **`joinEvent` in `src/services/firebaseService.ts` double-counts.** It calls `setDoc` on
   the participant document and then unconditionally `increment(1)` on `participantsCount`.
   Joining twice inflates the count. Fix it so the increment only happens when the participant
   document did not already exist (read it first with `getDoc`), and add a matching
   `leaveEvent` that deletes the document and decrements only if it did exist.
4. **`trackImpression` fires on every render.** `EventCard.tsx` calls it in a `useEffect` keyed
   on `event.deadline, event.id`, so filtering, searching and re-rendering all inflate
   impressions. Replace it with an `IntersectionObserver` that fires once per card per session,
   guarded by a `Set` of ids held in module scope.
5. **`subscribeToEvents` orders by `createdAt`, which is not on the `Event` type.** Add
   `createdAt?: any` to the `Event` interface so the ordering is honest, and make the query
   tolerate documents without it.

## 1. Anonymous identity — no login, no double counting

Create `src/services/identity.ts`:

- `ensureAnonymousAuth(): Promise<User>` — if `auth.currentUser` is null, call
  `signInAnonymously(auth)`. Resolve once a user exists.
- `getUid(): string | null`.
- `getSource(): string` — reads `?src=` from the URL on first visit, stores it in
  `localStorage` under `agorax_src`, and returns the stored value on later visits. Default
  `'direct'`.
- `linkContact({ name, email, phone, wantsToOrganise, hasSpace })` — writes `users/{uid}`
  with those fields plus `createdAt` (only if new), `lastSeenAt`, `source`, and
  `hasContact: true`. If another `users` document already has the same email or phone, also
  write `mergeRequests/{uid}` with `{ uid, otherUid, matchedOn, ts }`. Do **not** attempt to
  merge client-side.
- `touchUser()` — updates `lastSeenAt` on `users/{uid}`, called once per session.

In `App.tsx`:

- Replace the `onAuthStateChanged` effect so it calls `ensureAnonymousAuth()` first, then
  subscribes. The loading spinner stays until auth resolves, then the feed renders. There must
  be no sign-in screen at any point.
- Keep the uid in `localStorage` under `agorax_uid` as a secondary check, and if Firebase
  returns a different uid while a stored one exists, write `mergeRequests` as above.
- Write the code so the anonymous account can later be upgraded with `linkWithCredential`
  without losing the uid — do not build that UI now.

Joining must be idempotent: `events/{eventId}/participants/{uid}` with
`{ joinedAt, priceSeen, source }`. A card whose participant document exists shows "You're in"
with a way to leave.

## 2. Seed the 33 events

`src/data/seedEvents.ts` already exists in this project — read it. It exports `SEED_EVENTS`
(33 events with slug, title, description, category, price, minParticipants, durationHours,
hostsNeeded, fixedCost, perPersonCost, bringYourOwn, venueNote, season, emoji, accent),
`PLATFORM_FEE` and `organiserEarnings()`.

- Extend `EventCategory` in `src/types.ts` to include the seed categories:
  `'Sports' | 'Games' | 'Creative' | 'Social' | 'Study' | 'Tech & Ideas' | 'Outdoor'`. Keep the
  existing values so nothing breaks.
- Add the new fields to the `Event` interface as optional: `slug`, `durationHours`,
  `hostsNeeded`, `fixedCost`, `perPersonCost`, `bringYourOwn`, `venueNote`, `season`, `emoji`,
  `accent`, `opens`, `organiserInterest`, `createdAt`.
- Add `seedEvents()` to `firebaseService.ts`: for each seed event, `setDoc` to
  `events/{slug}` with `{ merge: true }` so re-running updates rather than duplicating. It
  must **not** overwrite `participantsCount`, `impressions`, `opens`, `joins` or
  `organiserInterest` on an existing document. Set `status: 'Pending'`, `organizerId: 'agorax'`,
  `imageUrls: []`, a `deadline` 21 days out and a `startTime` 28 days out.
- Trigger it from a **Seed events** button on the admin page (section 4), never on app load.
- Events with no `imageUrls` must render a generated cover: a gradient built from `accent`
  with the `emoji` centred and large. Never show a broken image. Apply this in `EventCard.tsx`
  and the detail view.

## 3. The validation landing page

Rework the feed (`FeedView`) into the scan-to-browse page:

- **Header:** one line — "What would you actually go to in Groningen?" — and a sub-line
  explaining the rule: "Every event has a target. When enough people want one, we run it."
- **Category filter chips** from the new categories, plus "All".
- **Grid of event cards.** Each card shows the emoji cover, title, price (or "Free"), duration,
  and a live progress bar: `{participantsCount} of {minParticipants} — {n} more and this runs`.
  Events marked `season: 'spring'` get a visible "Spring trip" badge.
- **Two buttons on every card:** a primary **I'd join** and a smaller secondary
  **Help run this · keep ~€XX**, where the figure is `organiserEarnings(e).perHost` rounded to
  a whole euro. Clicking the second one does *not* join; it opens the organiser panel below.
- **Organiser panel** (a modal or expanding section, reusing the existing `Modal`): shows the
  full breakdown — gross at the minimum headcount, the listed costs, the 7% platform fee, what
  each host keeps, how many hosts are needed, and the line:
  *"A second host joins automatically above 20 people — the earnings split between you."*
  It ends with: *"If fewer than {minParticipants} sign up, nothing is charged — you don't lose
  anything either."* and a button **I'd help run this** that records the interest and asks for
  contact details.
- **Price ladder.** After a join, on the person's *first* join and then roughly every third
  one, slide up a small sheet: "Would you still come if it were €{nextPrice}?" with
  **Yes / No / Depends**, and a visible **Skip**. `nextPrice` is the base price for that
  event — hardcode a `basePrice` map in `src/data/priceLadder.ts` (chess 2→3, bouldering 3→4,
  clay 18→25 and so on; use the seed price as the low tier and roughly +40% as the step).
  Record the answer, never block the join.
- **Contact capture.** After the first join, a non-blocking banner: "Leave a number and we'll
  tell you when one of your events is happening." Fields: first name (optional), WhatsApp
  number (primary), email (optional), plus a consent checkbox with the text
  *"We'll only use this to tell you when an event you picked is happening. Nothing else, and
  you can ask us to delete it any time."* Submit calls `linkContact`.
- **"Your picks" strip** fixed at the bottom once they have joined anything: how many events
  they picked and how close the nearest one is to running.
- **Suggestion box** at the end of the page: "An event you'd join that isn't here?" — one text
  field plus optional contact, written to `suggestions/{autoId}`.
- **"I have a space" link** in the footer: name, type of space, contact → `venueOffers/{autoId}`.
- Remove or hide the `create`, `venues` and `dashboard` tabs from the public navigation for
  now. This build is the landing page; keep the components in the codebase, just unreachable.

## 4. Admin page at `/admin`

Add `react-router-dom`. `/` is the landing page, `/admin` is new. Do not restructure anything
else.

**Access:** a user is an admin if `admins/{uid}` exists, with
`{ role: 'owner' | 'editor' | 'viewer', label, grantedBy, grantedAt }`. Non-admins get a plain
"Not authorised" page showing their own uid so it can be granted. Never crash.

**Metrics, all from live Firestore listeners:**

- Headline tiles: unique visitors (distinct uids in `users`), total joins, people who joined at
  least one event, contacts captured, average events picked per person, organiser-interest
  taps, venue offers, suggestions.
- Funnel with percentages: impressions → card opens → joins → contact submitted.
- Events table sorted by joins: title, category, price, minimum, joins, a progress bar toward
  the minimum, impressions, opens, open-to-join conversion, organiser-interest count.
- Joins broken down by `source` (which QR poster).
- Price ladder results per event: share answering yes / no / depends.
- Lists: suggestions with timestamps; people who tapped "help run this" or "I have a space",
  with their contact details and which event.

**Actions (role `owner` or `editor`):**

- Create, edit and delete any event — every field, including price, minParticipants, deadline,
  category, description, emoji and accent. This is the main thing the page is for: full
  editing of all events from one screen.
- Set an event's status to Confirmed or Cancelled manually.
- **Seed events** button that runs `seedEvents()`.
- Export any table to CSV, client-side, no library.
- Grant and revoke admin by uid with a role and a label — `owner` only. Show the current admin
  list.

Style it denser than the public page: tables, numbers, minimal decoration, same dark theme.

## 5. Analytics

Create `src/services/analytics.ts` with `track(name, payload)` writing to `analytics/{autoId}`:
`{ uid, name, payload, source, ts: serverTimestamp() }`.

Fire: `page_view`, `card_impression` (once per card per session, via the observer from 0.4),
`card_open`, `join_click`, `leave_click`, `organiser_panel_open`, `organiser_interest_click`,
`venue_offer_submit`, `contact_submit`, `suggestion_submit`, `price_ladder_answer`,
`scroll_depth_25/50/75/100`.

Also keep cheap aggregate counters on each event document — `impressions`, `opens`, `joins`,
`organiserInterest` — with `increment`, so the admin page never has to scan `analytics`.

## 6. Firestore rules

Rewrite `firestore.rules`. Keep the existing helper-function style. It must express:

- Anyone signed in, **including anonymous users**, can read `events`, `venues` and comments.
- Only admins may create, update or delete `events` and `venues` documents — **except** the
  counter fields `participantsCount`, `impressions`, `opens`, `joins`, `organiserInterest`,
  which any signed-in user may change, and only those.
- A user may create, update and delete only `events/{eventId}/participants/{their own uid}`.
- A user may read and write only their own `users/{uid}` document. Admins may read all of them.
- `analytics`, `suggestions`, `venueOffers`, `mergeRequests`: create only — no read, no update,
  no delete — and the `uid` field must equal the caller's uid. Admins may read.
- `admins/{uid}`: readable by any signed-in user so the UI can check; writable only by a user
  whose own `admins` document has `role == 'owner'`.
- Add an `isAdmin()` helper using `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`.

Note in the README that the first admin has to be created by hand in the Firebase console,
since nobody can grant themselves `owner`.

## 7. Finally

- Make sure Anonymous sign-in is enabled in Firebase Auth, and say so in the README.
- Run `npm run lint` (`tsc --noEmit`) and fix every type error.
- Run `npm run build` and make sure it passes.
- Update `README.md`: what this build is for, how to seed, how to make the first admin, how
  the QR `?src=` parameter works, and the list of analytics events.

Do not add a login screen. Do not take payments. Do not promise dates for events that do not
exist yet.
