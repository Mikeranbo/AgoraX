# AgoraX — demand-validation build

This build is a **scan-to-browse landing page** for testing demand around the University of
Groningen. Students reach it by scanning a QR code on a poster, browse 33 possible events, and
say which ones they'd actually go to — **without creating an account**. An event only "runs"
when enough people want it; until then nothing is charged and no dates are promised.

What it measures: which events get picked, how many people are needed to tip each one, whether
a higher price still works (the *price ladder*), who would help organise, who has a space, and
which poster each visitor came from.

Stack: React 19, TypeScript, Vite 6, Tailwind v4, `motion/react`, `lucide-react`,
`react-router-dom`, Firebase Auth + Firestore.

## Routes

| Path     | What it is                                                                 |
| -------- | -------------------------------------------------------------------------- |
| `/`      | The public landing page. No login, no sign-in screen at any point.          |
| `/admin` | Admin dashboard: live metrics, full event editing, CSV export, admin grants. |

Vercel already rewrites every path to `index.html` (`vercel.json`), so `/admin` survives a refresh.

## How identity works (no login, no double counting)

Every visitor is silently signed in as a Firebase **anonymous** user. The uid is the only
identity key:

- Joining is idempotent: `events/{eventId}/participants/{uid}`. Joining twice never inflates the
  count — the counters only move inside a transaction that first checks the document did not exist.
- Contact details (WhatsApp / email) are plain fields on `users/{uid}`, never the key. That means
  the anonymous account can later be upgraded with `linkWithCredential` and keep the same uid
  (`upgradeAnonymousAccount` in `src/services/identity.ts` — there is intentionally no UI yet).
- Accounts are **never linked or flagged as the same person** from a typed email/phone or a uid
  the browser reports — neither proves ownership. The old hashed `contactKeys` lookup and the
  `mergeRequests` it produced are retired (the lookup let anyone check whether a given person had
  signed up). Linking devices needs a verified flow first; see `docs/SECURITY.md`.

## The `?src=` QR parameter

Put a different `src` on the URL of each poster:

```
https://<your-domain>/?src=ub-library
https://<your-domain>/?src=bernoulliborg-door
```

The first `src` a browser ever sees is stored in `localStorage` (`agorax_src`) and reused on every
later visit — **first touch wins**, so a student who scans poster A and later poster B is credited
to A. It is saved on their `users` document, on every join, and on every analytics event, and
shows up in the admin page under *Joins by source*. Allowed characters: `a-z 0-9 _ -` (40 max).
No `src` = `direct`.

## Firebase console — one-time setup

Do these in the Firebase console for the project in `firebase-applet-config.json`.

1. **Enable Anonymous sign-in.** Authentication → Sign-in method → Anonymous → Enable.
   Without this the site shows "Anonymous sign-in is not enabled" and nothing works.
2. **Publish the security rules.** Firestore Database → Rules → paste the contents of
   `firestore.rules` → Publish. (Or `firebase deploy --only firestore:rules`.)
3. **Create the first admin by hand.** Nobody can grant themselves any admin role, and there is
   no "claim owner" button, so the first owner has to be written in the console (full procedure
   and checks in `docs/SECURITY.md`):
   1. Open `/admin` in the browser you'll use for admin work. You'll see **Not authorised** and
      your uid — copy it.
   2. Firestore Database → Start collection (or open it) → collection `admins` → document ID =
      **your uid** → fields:
      `role` (string) = `owner`, `label` (string) = `Your name`, `grantedBy` (string) = `console`,
      `grantedAt` (timestamp) = now.
   3. Reload `/admin`. From then on owners can grant and revoke admins from the page.

   The uid belongs to that browser profile. Clearing site data creates a new uid (and a new
   "Not authorised" page) — grant the new one from an owner account, or upgrade the account first.
4. **Seed the events.** Sign in to `/admin` as an `owner` or `editor` → **Seed events**.
   Seeding writes no dates: proposals show "Date to be confirmed". To schedule an event, edit it,
   set the start time, tick **Date confirmed** and set the status to Confirmed; only then does it
   appear under Scheduled with its date.
   It writes `events/{slug}` for the 33 events in `src/data/seedEvents.ts` and is safe to re-run:
   existing events get their copy/price/cost fields refreshed, but signups, counters, status,
   photos and dates are left alone. Seeding never happens on page load.

### Roles

| Role     | Can do                                                                  |
| -------- | ----------------------------------------------------------------------- |
| `viewer` | Event totals, joins, helper offers, proposals, suggestions on `/admin`. No names, contact details, visitor counts or price answers. |
| `editor` | Everything a viewer can, plus contact details, create / edit / delete events, set status, seed, fix counts, export. |
| `owner`  | Everything an editor can, plus see, grant and revoke other admins (never their own entry). |

Roles are enforced by the Firestore rules, not just hidden in the UI.

## Admin page

- **Overview tiles** — unique visitors, total joins, people who joined, contacts captured, average
  events picked, organiser-interest taps, venue offers, suggestions.
- **Funnel** — impressions → card opens → joins → contact submitted, with percentages.
- **Events table** — sorted by joins, with progress toward the minimum, open→join conversion and
  organiser interest. Create, edit (every field), delete, and set Confirmed / Cancelled.
- **Joins by source**, **price-ladder results** per event, lists of people who want to run an event,
  people with a space, and suggestions. Every table exports to CSV.

Cancelled events disappear from the public page but stay visible here. Deleting an event removes
it from the metrics; its old participant documents are left behind (the rules only let a person
delete their own) and are simply ignored.

## Analytics

`track(name, payload)` in `src/services/analytics.ts` writes to `analytics/{autoId}` as
`{ uid, name, payload, source, ts }`:

`page_view`, `card_impression`, `card_open`, `join_click`, `leave_click`,
`organiser_panel_open`, `organiser_interest_click`, `venue_offer_submit`, `contact_submit`,
`suggestion_submit`, `price_ladder_answer`, `scroll_depth_25`, `scroll_depth_50`,
`scroll_depth_75`, `scroll_depth_100`.

`card_impression` and `card_open` fire once per card per session (an `IntersectionObserver` plus a
module-level `Set`, mirrored to `sessionStorage`). Each event document also carries cheap
aggregate counters — `impressions`, `opens`, `joins`, `organiserInterest` (and `participantsCount`)
— so the admin page never has to scan `analytics`.

> **Write volume:** a visitor's first scroll past all 33 cards causes ~99 writes (an analytics
> document, a seen marker and a counter bump per card); later visits from the same device add only
> the analytics documents. The Firebase free (Spark) plan allows 20,000 writes/day, i.e. roughly
> 200 first-time visitors. Switch the project to Blaze before a busy poster campaign.

## Collections

| Collection                          | Written by                  | Read by              |
| ----------------------------------- | --------------------------- | -------------------- |
| `events`, `venues`                  | admins (editor/owner); counters only by the steps below | anyone signed in |
| `events/{id}/participants/{uid}`    | that user, together with participantsCount ±1 | that user, admins |
| `events/{id}/helpers/{uid}`         | that user, together with organiserInterest ±1 | that user, admins |
| `events/{id}/seen/{uid}`            | that user, together with impressions/opens +1 (once each) | nobody |
| `events/{id}/comments`              | nobody (switched off)       | admins               |
| `users/{uid}`                       | that user only, field-by-field checks | that user, editors/owners |
| `analytics`, `suggestions`, `venueOffers` | create-only, `uid` must be the caller, field allowlists | admins |
| `proposals`                         | the author: create, edit and delete while `draft`, send once (`new`); editors approve/reject | the author, admins |
| `profiles/{publicId}`               | its owner (random id, never the uid), field allowlist, no verified/registered flags | anyone signed in who has the id; admins can list |
| `profileOwners/{publicId}`          | claimed once by the owner; released on delete | nobody |
| `mergeRequests`, `contactKeys`      | retired: no new writes (own contact keys can still be erased) | editors (`mergeRequests`), nobody (`contactKeys`) |
| `admins/{uid}`                      | owners, for other uids only | that user (own doc), owners |

`npm run test:rules` checks all of this against the Firestore emulator (needs JDK 21+).

## Privacy

- The draft privacy notice is `docs/PRIVACY_NOTICE_DRAFT.md` (same text as the in-app page,
  `src/data/privacyNotice.ts`). It is **not final**: open facts are listed at its top.
- Contact details (email *or* WhatsApp, either is enough) are only collected behind a consent box
  per purpose; each consent stores its purpose, wording version, notice version and server time.
  Launch news and invitations are separate, unticked, email-only opt-ins.
- People switch messages off under Notification preferences, delete contact details under Privacy
  & my data, and delete everything (interests withdrawn, account deleted) under Account &
  security. Messages are sent by hand: there is no email provider, so no unsubscribe links.
- While the notice is a draft the build leaves out new collection (public profile text/pictures,
  organiser identity, launch/invitation opt-ins). Set `VITE_PRIVACY_NOTICE_FINAL=true` only once it
  is final.
- Admins can't delete `users` documents from the app; a deletion request by email is handled in
  the Firebase console (delete `users/{uid}`, any `contactKeys` whose `uid` is that uid, and the
  person's `profiles/{publicId}` and `profileOwners/{publicId}`).

## Environment variables

All public build-time configuration (none is a secret):

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_PRIVACY_NOTICE_FINAL` | unset (off) | `true` turns on public profiles, organiser identity and launch/invitation opt-ins. Only after the privacy notice is final. |
| `VITE_FIREBASE_EMULATORS` | unset | `1` points the app at the local emulators under `demo-agorax` (browser tests only). Never set it on Vercel. |
| `PW_CHROMIUM_PATH` | unset | Test-only: a preinstalled Chromium for Playwright. |

`GEMINI_API_KEY` and `APP_URL` in `.env.example` are AI Studio leftovers that nothing uses.

## Run locally

```
npm install
npm run dev        # http://localhost:3000
npm run lint       # tsc --noEmit
npm run build
npm test           # unit tests (vitest)
npm run test:rules # security rules + real client flows on the Firestore emulator (JDK 21+)
npm run test:e2e   # browser tests (Playwright) on the Firestore + Auth emulators
```

The emulator and browser tests only ever use the `demo-agorax` project id, so they cannot touch
the real project.

The old email/password `AuthHero`, the create-event form, the venues marketplace and the owner
dashboard are still in `src/App.tsx` but are not reachable from the public build.
