# Prompt for the next Claude Code session

Project: `D:\proects\work\agora x\code\code 3` (github.com/Mikeranbo/AgoraX). Firebase project
`agorax-a8d07` (Blaze, europe-west4), Vercel deploys `main` to https://agora-x.vercel.app.

## Fairer prices, mock exam for any subject, TOPSIM (23 Nov 2026)

Mike's decisions of 23 Nov, from branch `fairer-prices`, same prices on page A and page B:

- Price rule (comment at the top of `src/data/seedEvents.ts`): free when there is nothing to pay for
  and little to prepare (15 events, e.g. Walk & Talk, Trading Strategy Meetup, Coffee Roulette,
  Potluck, Chess, Karaoke, Film Club, Hiking); €2–3 when someone prepares and runs it (€3 for
  tournaments, workshops and full days); real costs per person plus about €2 when there are
  materials, an instructor, a rental or a campsite (Clay €17, Candles €10, Tote €7, Salsa €6,
  Cooking €10, Kayak €17, Camping €10, Surf €22). `simpleEvents.test.ts` checks no price is more than
  costs per person + €3.
- Padel and tennis: ACLO provides the courts, so no court cost; €3 each, like ping-pong, which only
  pays the host who organises the tournament (~€45 at 16 people).
- "Mock Exam Session" was never deleted; it is now "Mock Exam (any subject)" (slug kept, so its
  sign-ups stay), €3.
- New: "TOPSIM Competition (management game)", Study, €3, min 16 (teams of four), 3 h. No licence
  cost included: running real TOPSIM needs a licence from its maker (or through Hanze). Photos in
  `public/media/topsim-competition`.
- 44 events now. Descriptions that name a price were updated with it (test checks "the €N").

## Page A shows all events, real prices, tournaments (22 Nov 2026, evening)

Mike's decisions of 22 Nov (evening), merged into main from branch `page-a-all-events`:
Live and checked on 22 Nov 2026: seeded through /admin (3 created, 40 updated); in fresh browsers page A
lists 43 events with prices, the tournaments show on both pages, nothing is stored before a click,
and "Help run this" works on page A as the first action (the test offer was deleted again).
The A/B numbers from before this change (A 4 visits, B 8) were collected with the old 12-event page A.
Tests: lint, build, `npm test` 124, rules 272 checks + 16 client flows, e2e 93 passed (6 skips).


- Page A (simple design) lists every event page B lists: 43, with the same category chips, as one
  list. The "On page A" tick on /admin still takes an event off page A (`visible: false`); without it
  every event shows (`isOnPageA` in `src/data/simpleEvents.ts`). The old shortlist of 12 is gone.
- Real prices on page A: the seed price, as on page B (no more "Free"). The price question steps up
  from the shown price as before (`nextPriceFor`). Every event has its four plain answers in
  `src/data/simpleEvents.ts`; "What the price pays for" starts with the price and names the cost per
  person (`simpleEvents.test.ts` checks both against `seedEvents.ts`).
- Opened event on page A: "Help run this" sits next to "I'd go" (two equal columns). Where a host
  keeps something at the minimum: "Help run this / keep ~€X" and the line "The host keeps the ticket
  money after costs: an estimated €X if N people come." Free events: only "Help run this". It opens the
  same host panel and form. The old section below the details is gone.
- New category Sports (now a public category, after Games) with three tournaments, on both pages:
  Ping-Pong Tournament (€3, min 12, no costs, host keeps ~€33), Padel Tournament (€12, min 16, courts
  €120, ~€59), Tennis Tournament (€12, min 16, two indoor courts €140, ~€39). Ping-pong and padel
  numbers are the old Ping-Pong Challenge / Padel Cup entries; tennis is modelled on padel. Message:
  "Train at ACLO, play for fun with us". Photos in `public/media/*-tournament` (Unsplash, credits in
  `public/media/CREDITS.md`).
- Two descriptions corrected to match their numbers: Candle Making ("About €8 of the €18 pays for
  materials") and Beginner Salsa ("The €9 pays the instructor and the host").
- Page B's `agorax.entry.done` (sessionStorage) is written only when the pilot notice is closed with
  a tap; `e2e/storage.spec.ts` now proves it.
- /admin → A/B test: both pages list the same events, so "Picks per event shown on both pages" covers
  all of them.

## A/B test: LIVE on main since 22 Nov 2026 (privacy notice 1.2)

Mike approved notice 1.2 on 22 Nov 2026 (adds the page version in §2, §3, §5 and §6). Firestore rules
deployed, ab-test merged into main and live. Checked live in fresh browsers: page A and page B both
appear across reloads, nothing is stored before a click, ?v=simple and ?v=current open the right page
and store nothing. The live check added 2 real visits under ?src=livecheck (one A, one B).
Test links: https://agora-x.vercel.app/?v=simple (page A) and https://agora-x.vercel.app/?v=current (page B).

- One link, two pages: `src/config/concept.ts` picks page A (`simple`) or B (`current`) when the page
  loads. `?v=` forces a page (stamped `simple-test` / `current-test`, never counted); a saved
  `agorax_variant` keeps a returning browser on its page; otherwise a 50/50 coin flip in memory.
- At the first action the variant is saved with the ID (`users/{uid}.variant`, set once, and
  localStorage `agorax_variant`) and stamped on every join (with the price shown), helper offer,
  message and analytics event. An ID from before the test gets its variant with its first contact.
- Page loads add +1 to `visits/{src}.count` and to `.simple` or `.current` (the rules allow one of
  them, by exactly 1). Test visits are not counted at all.
- /admin → "A/B test" (top): A and B side by side: visits, picked at least one (count, % of visits),
  left a contact (count, %), average picks per picker, help-run offers, messages, and picks per
  event for every event on both pages (since 22 Nov evening both pages list the same 43). Picks from
  test visits are listed apart.
- Mike should use https://agora-x.vercel.app/?v=simple and ?v=current himself, so his own taps
  don't count. Progress bars stay shared across both pages.
- Tests (22 Nov, fresh emulators): lint, build, `npm test` 116 passed, `npm run test:rules` 272 checks
  plus 16 client flows, e2e 89 passed (4 device skips) for page A and page B at 390 and 1280 px and
  for the real coin flip (`e2e/ab.spec.ts`: both pages across reloads with nothing stored, ?v=
  override not counted, full path ?src=test → pick → contact → /admin under the right page).
- e2e servers: :5179 page B, :5181 page A, :5180 page B default build, :5183 real coin flip
  (`VITE_AB_VARIANT` replaces the flip, tests only).

## How Mike works

Mike (legal name Michael Aleinikov) is a Hanze IBS student building AgoraX alone; not a developer,
limited usage. Give one complete answer; don't ask what the files can answer. Exact steps for anything
he must do himself. Never ask for or use his passwords; stop at a Google sign-in page. On his PC,
PowerShell blocks `npx`: use `npx.cmd` (Git Bash `npx` works).

## Decisions (21 Nov 2026)

1. Mentor feedback (Henry): the page is overloaded; stock photos/videos and doodles hurt; the pilot
   explanation is hidden; unclear what prices pay for; people are scared to host; posters convert
   weakly and Hanze is strict about them. So: simplify, and compare two concepts on branches.
2. `main` stays as it is (cut-out opening page). Restore tag: `cutout-hero-original` (main before
   21 Nov). After the privacy work below, main is not changed again until a concept wins.
3. Privacy: controller Michael Aleinikov, Suikerlaan 1, 9743 DA Groningen, mikhailalenikau@gmail.com,
   no KvK. Pilot ends 31 March 2027; contact details deleted by 30 June 2027; statistics deleted
   31 March 2027. Nothing stored on the device before the first action. Only the owner reads contact
   details.

## State of main (21 Nov 2026)

- Privacy notice 1.1 is live: `src/data/privacyNotice.ts` is `docs/PRIVACY_NOTICE_FINAL.md` word for
  word (`src/data/privacyNotice.test.ts` fails if they differ). NOTICE_VERSION `1.1-2026-11-21`,
  CONTACT_EMAIL mikhailalenikau@gmail.com. Terms, Cookie Policy and Imprint name the operator; no
  "[To be confirmed]" left. The old draft notice file was removed.
- Nothing on the device before the first action (Telecommunicatiewet 11.7a):
  - Firebase Auth starts lazily (`getAuthLazy()` in `src/lib/firebase.ts`); the anonymous ID is made
    by the first action (Interested, a form, Save, ...). A returning browser is recognised by
    `agorax_id` / the old `agorax_src` / Firebase's IndexedDB and restored on load.
  - The Firebase SDK's IndexedDB "heartbeat" is switched off in `src/lib/firebase.ts`.
  - `?src` and `?ref` stay in memory and are written to `users/{uid}` when the ID is made.
  - Page loads only add +1 to `visits/{src}` (no ID). /admin "Visits" and "Visits from posters" use it.
  - `once()` is memory-only; the pilot-notice flag and statistics answer are stored only on a click.
  - `e2e/storage.spec.ts` proves it: fresh load with `?src=test` and a shared link leave
    localStorage, sessionStorage, IndexedDB and cookies empty; the first "I'm interested" creates the
    ID with `src=test`.
- Firestore rules: events, initials, venues and public profiles are readable without an ID. Only role
  `owner` reads `users` (contact details), helper offers, space offers, proposals and suggestions, and
  decides proposals and organiser applications. `editor` edits events and media. Owner-only
  "contact wipe" update on users. Rules tests: `npm run test:rules` (251 checks + 16 client flows).
- Footer on every page: "Privacy & my data" (delete contact details, delete everything, statistics
  Allow / No thanks). With no ID it says nothing is stored and creates nothing.
- /admin (owner): "Contact data" section with "Delete all contact data" (two-step confirm). It wipes
  numbers, emails, names, consents and shown initials; delete WhatsApp/Gmail chats by hand.
- `VITE_PRIVACY_NOTICE_FINAL=true` is set in Vercel (Production and Preview). Public profiles and the
  launch/invitation emails are NOT covered by notice 1.1, so they need a second flag,
  `VITE_EXTRA_DATA_FEATURES=true`, which stays unset in Vercel (tests switch it on).
- Vercel: plan **Hobby** (team "mikeranbo's projects"). Vercel's DPA only covers Pro/Enterprise, so
  moving hosting to Firebase Hosting is an open decision. Live responses set no cookies (checked).
- Tests on 21 Nov: lint, build, `npm test` (110 passed), `npm run test:rules` (all passed),
  e2e 59 tests (all passed after two wording fixes; 4 device skips).

## Concept branches (both from the updated main)

- `concept-simple` (mentor's version): Events page explains itself at the top (pick → we count → it
  happens, or nobody pays), nav is only Events and My picks, 12 visible events with plain "what you do /
  what's included / what you bring / what the price pays for", photos only, "Help run this" only on the
  event page, one footer line "Want to run or host something? Tell us" with one short form, contact
  sheet right after the first "I'd go", then the price question once. Flags live in
  `src/config/concept.ts` (sidebar, account types, locked items, filters, doodles are hidden, not
  deleted). Events have an optional `visible` field, toggled on /admin; without it the default 12 are
  shown.
- `concept-current` (Mike's version, cleaned): main without the cut-out opening hero (slim top bar
  with the logo instead), without the city / location / date filter box, and photos only.
- Preview links (Vercel branch aliases):
  https://agora-x-git-concept-simple-mikeranbos-projects.vercel.app and
  https://agora-x-git-concept-current-mikeranbos-projects.vercel.app
  Preview deployments on the Hobby plan may ask for a Vercel login (Deployment Protection) unless it
  is switched off in Vercel → agora-x → Settings → Deployment Protection.
- Each branch's own copy of this file has its test status at the bottom.

### The 12 events on concept-simple (and why)

Free or cheap, runnable by Mike alone with no instructor or special venue, and asked for by students
(interviews: `../../AgoraX-interviews.xlsx`; survey: `../../AgoraX survey responses.xlsx`):

1. Chess Challenge: three survey answers asked for chess.
2. Film Club: movies in the interviews, three survey asks for a film night.
3. Photo Walk & Share: two survey asks for photo walks; a phone is enough.
4. Mafia / Werewolf Night: asked for in the survey; one host and cards.
5. Reading Meetup: two survey asks for a reading night; free.
6. Board-Game Discovery: game nights are what students already organise; people bring games.
7. Park Games: sport is the most common hobby; a park needs no booking.
8. Walk & Talk Groningen: walking in the survey; free, suits newcomers.
9. International Potluck: cooking and dinners in interviews and survey; shared kitchen.
10. Tote-Bag Painting: art asks in the survey; €5 = bag + fabric paint (the real cost per person).
11. Hiking Trip: hiking and walking in the survey; own train ticket.
12. Karaoke Night: parties and drinks are the biggest interview theme; the bar lends the room.

All except tote-bag painting have no real cost, so they show as Free on concept-simple.

## Still open (not done yet)

- Reply to Henry with the research: 22 student interviews; 11 of the 19 with a hobby went to no
  related event last month.
- Choose the winning concept, then merge it into main (`git merge` the branch; check rules and tests).
- Hosting: move to Firebase Hosting if staying on Vercel Hobby (no DPA).
- Distribution: WhatsApp/Telegram class groups, study associations, ESN, Instagram, short lecture
  pitches, flyers handed out in person.
- Install WhatsApp Business to message students.
- Check the name "AgoraX" against trademarks (BOIP/EUIPO).
- Older open points (docs/SECURITY.md): retired `contactKeys`, API key restriction, App Check,
  `npm audit fix` (never `--force`), unused `@google/genai`.
- The visit counter accepts +1 from anyone, so a script could inflate it; fine for a pilot.

## Admins and data

- Admins: `0iWlXrItViTi0MWyWvJOLaApjfG3` owner "Mike (founder)"; `LUhMLDBO3CP0OsuSGlpUCUyNTqM2` editor
  "Claude (co-founder)" (the Claude desktop browser pane). Editors can no longer read contact details.
- Storage bucket `agorax-a8d07.firebasestorage.app`: photos jpeg/png/webp ≤10 MB, videos ≤50 MB in
  `events/<id>/`, uploaded by editors and the event's organiser.
- Backups: `..\backups\firestore-events-before-40-2026-11-05.json`,
  `..\backups\code3-before-ec69644-2026-10-23\`, local branch `backup/before-ec69644`.

## Local emulator preview (never point it at production)

1. `npx.cmd firebase emulators:start --only firestore,auth --project demo-agorax`
2. Seed: `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node --input-type=module -e "import seed from './e2e/seed.mjs'; await seed();"`
3. PowerShell: `$env:VITE_FIREBASE_EMULATORS = '1'; npx.cmd vite --port 5173 --strictPort --host 127.0.0.1`
4. Open http://127.0.0.1:5173. A plain `npm run dev` talks to the real Firebase project.
5. Browser tests without Playwright's own browser: set `PW_CHROMIUM_PATH` to
   `C:\Program Files\Google\Chrome\Application\chrome.exe`.

## Branch concept-simple as built (22 Nov 2026)

- Branched from main after the privacy work. Flags in `src/config/concept.ts` (switched off, not
  deleted): menu and account, coming-soon items and votes, place and date filters, the Scheduled
  switch, doodles (plain navy), videos, the opening hero and the pilot notice on entry (the
  explainer on top says it; "About the pilot" in the footer still opens the notice).
- Shortlist: `src/data/simpleEvents.ts` (12 events, the four plain answers, the shown price).
  /admin → Events has a "Shown" tick per event; it writes `visible` on the event and overrides
  the default 12. Hidden events keep their data and sign-ups.
- Shown prices: Free where there is no real cost; tote-bag painting €5 (bag + paint). The price
  question steps up from the shown price (Free → €2, €5 → €7) and is asked once, after the
  contact sheet that follows the first "I'd go".
- "Tell us" (footer) saves a suggestion tagged [Run] / [Host] / [Idea] plus the contact on
  users/{uid} with that purpose's consent; /admin shows them with the contact (owner only).
- Also here: "Help run this" creates the ID on submit (main still waits for Mike's OK on that fix),
  and /admin → Contact data lists each person, their picks and source (CSV export).
- Tests: lint, build, `npm test` 110 passed; e2e on this build: `concept-simple.spec.ts` (shortlist,
  no dates or videos, full path ?src=test → I'd go → contact → price question → /admin) and
  `storage.spec.ts`, 18 passed at 390 and 1280 px. The menu/account/filter specs are skipped on this
  branch in `e2e/playwright.config.ts` because those parts are hidden here.

## Branch concept-current as built (22 Nov 2026)

- Branched from main after the privacy work. Flags in `src/config/concept.ts`: `openingHero` off (a
  first visit starts at the pilot notice; a slim bar with the logo sits above the list, hidden on a
  laptop while the sidebar shows the logo), `placeAndDateFilters` off (city, "Use my location",
  All / Near / Other, Today / Tomorrow, "How near works"), `videos` off (photos only). Search,
  category chips and the Proposals / Scheduled switch stay.
- Also here: the "Help run this" form creates the ID on submit (on main it silently does nothing
  for a visitor without an ID yet; fix waiting for Mike's OK), and /admin → Contact data lists every
  person with a number or email, their picks and source (CSV export).
- Tests: lint, build, `npm test` 110 passed; e2e 59 passed, 4 device skips, including
  `e2e/full-path.spec.ts` (?src=test → pick → contact → /admin shows it) at 390 and 1280 px.
