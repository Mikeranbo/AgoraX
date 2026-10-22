# Firestore rules v2: allow/deny cases

Run these in Firebase Console → Firestore → Rules → **Rules Playground** after publishing
`firestore.rules`. "Visitor" = any authenticated uid with no `admins/{uid}` doc. "Editor" and
"viewer" need an `admins/{uid}` doc with that role. Use event id `chess-challenge`.

Syntax is already verified offline with Firebase's own grammar (`@firebase/eslint-plugin-security-rules`
parser: accepts this file, rejects a deliberately broken copy). The logic below has **not** been
run — Java is not installed, so the emulator cannot run here.

| # | Actor | Operation | Path | Data / state | Expected |
|---|---|---|---|---|---|
| 1 | visitor A | create | `events/chess-challenge/participants/A` | `{joinedAt: now, priceSeen: 3, source: 'ub'}` | allow |
| 2 | visitor A | create | `events/chess-challenge/participants/B` | same | **deny** (not own uid) |
| 3 | visitor A | update | `events/chess-challenge` | `participantsCount +1, joins +1`, in the same batch as #1 | allow |
| 4 | visitor A | update | `events/chess-challenge` | `participantsCount +1, joins +1`, **without** creating a participant doc | **deny** |
| 5 | visitor A | update | `events/chess-challenge` | `participantsCount +2, joins +2` | **deny** |
| 6 | visitor A | update | `events/chess-challenge` | `participantsCount −1, joins −1`, deleting own participant doc in the same batch | allow |
| 7 | visitor A | update | `events/chess-challenge` | `participantsCount +1, joins +0` | **deny** (must move together) |
| 8 | visitor A | update | `events/chess-challenge` | `impressions +1` | allow |
| 9 | visitor A | update | `events/chess-challenge` | `impressions −1` | **deny** |
| 10 | visitor A | update | `events/chess-challenge` | `price: 1` | **deny** |
| 11 | visitor A | create | `events/chess-challenge/helpers/A` + `organiserInterest +1` in same batch | `{ranBefore: 'no', ts: now}` | allow |
| 12 | visitor A | create | `events/chess-challenge/helpers/A` | `{ranBefore: 'no', ts: now, phone: '+31…'}` | **deny** (extra field) |
| 13 | visitor A | update | `events/chess-challenge` | `organiserInterest +1`, no helper doc created | **deny** |
| 14 | visitor A | create | `events/chess-challenge/comments/x` | any | **deny** (comments off) |
| 15 | visitor A | create | `proposals/p1` | valid fields, `status: 'new'` | allow |
| 16 | visitor A | create | `proposals/p1` | valid fields, `status: 'approved'` | **deny** |
| 17 | visitor A | get | `proposals/p1` | — | **deny** |
| 18 | visitor A | update | `users/A` | `{role: 'owner'}` added | **deny** (not in allowlist) |
| 19 | visitor A | get | `users/B` | — | **deny** |
| 20 | visitor A | create | `venueOffers/v1` | `{uid: A, spaceType: 'cafe', capacity: 40, source: 'ub', ts: now}` | allow |
| 21 | visitor A | create | `venueOffers/v1` | same plus `contact: '…'` | **deny** |
| 22 | visitor A | delete | `contactKeys/k` | `resource.uid == A` | allow |
| 23 | visitor A | delete | `contactKeys/k` | `resource.uid == B` | **deny** |
| 24 | visitor A | list | `contactKeys` | — | **deny** |
| 25 | viewer | delete | `events/chess-challenge/participants/A` | — | **deny** |
| 26 | editor | delete | `events/chess-challenge/participants/A` | — | allow (purge) |
| 27 | editor | update | `proposals/p1` | `status: 'approved', eventId: 'e1'` | allow |
| 28 | editor | write | `admins/X` | — | **deny** (owners only) |
| 29 | owner | write | `admins/X` | `{role: 'viewer'}` | allow |
| 30 | visitor A | get | `admins/A` | — | allow (UI checks its own access) |
