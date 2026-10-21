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
- If the same email or phone turns up under a different uid, a `mergeRequests/{uid}` document is
  written for a human to review. Accounts are **never merged client-side**. (Because rules stop one
  visitor reading another's `users` document, matches are found through opaque hashed lookup
  documents in `contactKeys`.)
- The uid is also kept in `localStorage` (`agorax_uid`); if Firebase hands back a different uid
  while a stored one exists, a merge request is written too.

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
3. **Create the first admin by hand.** Nobody can grant themselves `owner`, so the first one has
   to be written in the console:
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
   It writes `events/{slug}` for the 33 events in `src/data/seedEvents.ts` and is safe to re-run:
   existing events get their copy/price/cost fields refreshed, but signups, counters, status,
   photos and dates are left alone. Seeding never happens on page load.

### Roles

| Role     | Can do                                                                  |
| -------- | ----------------------------------------------------------------------- |
| `viewer` | Read everything on `/admin`.                                            |
| `editor` | Everything a viewer can, plus create / edit / delete events, set status, seed, export. |
| `owner`  | Everything an editor can, plus grant and revoke admins.                 |

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

> **Write volume:** one visitor who scrolls past all 33 cards causes ~66 writes (an analytics
> document plus a counter bump per card). The Firebase free (Spark) plan allows 20,000 writes/day,
> i.e. roughly 300 such visitors. Switch the project to Blaze before a busy poster campaign.

## Collections

| Collection                          | Written by                  | Read by              |
| ----------------------------------- | --------------------------- | -------------------- |
| `events`, `venues`                  | admins (editor/owner); counters by anyone | anyone signed in |
| `events/{id}/participants/{uid}`    | that user only              | that user, admins    |
| `events/{id}/comments`              | any signed-in user          | anyone signed in     |
| `users/{uid}`                       | that user only              | that user, admins    |
| `analytics`, `suggestions`, `venueOffers`, `mergeRequests` | create-only, `uid` must be the caller | admins |
| `contactKeys`                       | create-only                 | single-key lookup; admins can list |
| `admins/{uid}`                      | owners only                 | anyone signed in     |

## Privacy

Contact details are only collected behind an explicit consent checkbox ("We'll only use this to
tell you when an event you picked is happening. Nothing else, and you can ask us to delete it any
time."). The rules do not let admins delete `users` documents from the app, so a deletion request
is handled by hand in the Firebase console (delete `users/{uid}` and its `contactKeys` entries).

## Run locally

```
npm install
npm run dev        # http://localhost:3000
npm run lint       # tsc --noEmit
npm run build
```

The old email/password `AuthHero`, the create-event form, the venues marketplace and the owner
dashboard are still in `src/App.tsx` but are not reachable from the public build.
