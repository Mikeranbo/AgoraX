# AgoraX — exact app changes, screen by screen

This is the definitive list of what changes in the app. Where it disagrees with
CLAUDE_CODE_PROMPT.md, this file wins. Line numbers refer to src/App.tsx as of
21 Oct 2026.

## 1. Opening the app

- REMOVE the login screen: `if (!user) return <AuthHero />` (~line 1125). The app
  opens straight on the event feed.
- ADD silent anonymous sign-in. The same phone is the same person on every visit.
  Joining twice counts once.
- ADD reading `?src=` from the QR link and keeping it for that visitor.

## 2. Top of the feed (FeedView, ~line 223)

- REMOVE the Bell button and the Notifications modal (~line 1317). It shows fake
  entries ("Botanic Yoga reached its threshold", "Payout Successful €145.00").
- CHANGE the "Discover" title to: "What would you actually go to?" with one line
  under it: "Every event has a target. When enough people want one, it happens."
- KEEP search, filtering the cards on the page.
- ADD category chips: All · Sports · Games · Creative · Social · Study ·
  Tech & Ideas · Outdoor. Sticky at the top on mobile.

## 3. Bottom navigation (~line 1416)

- NOW: Feed · Spaces · (+) Create · Your Hub · More.
- CHANGE TO: Events · (+) Propose · My picks.
- REMOVE the Spaces tab (venue marketplace), the Your Hub tab (organiser
  dashboard) and the More menu (Wallet & Payouts, Connect Stripe, metrics,
  security). Keep the components in the code; just make them unreachable.

## 4. Event card (src/components/EventCard.tsx)

- COVER: the event's `emoji` on a gradient of its `accent` colour from
  seedEvents.ts. No stock photos, no ticket icon. Camping and surfing get a
  "Spring trip" badge.
- META ROW: price (or "Free") · duration · "needs 12".
- PROGRESS, the most visible thing on the card: "8 of 12 — 4 more and this
  runs". The number counts up and the bar fills when the card scrolls into
  view. At the minimum the card turns green: "This is happening".
- DEADLINE: show "Closes 10 Nov", not a ticking countdown.
- BUTTONS: primary "I'd join", secondary "Help run this · keep ~€84" (from
  `organiserEarnings(e).perHost`, rounded).
- JOINED STATE: "You're in ✓" with a small "Leave".
- FIX: reaching the minimum currently disables joining and shows "Full"
  (`isConfirmed ? 'Full' : 'Join Now'`, button disabled at 100%). The minimum is
  not a capacity. People must still be able to join after it is reached.
- FIX: impressions are tracked once when the card becomes visible, not on every
  render.

## 5. Event detail (EventDetailView, ~line 294)

- SHOWS: full description; where (`venueNote`); duration; what's included and
  what you bring yourself (`bringYourOwn`); minimum and progress; closing date;
  how many hosts it needs; both buttons.
- REMOVE comments for now. They are an anonymous public write surface that
  needs moderation, and nothing has happened yet to talk about.

## 6. Organiser panel (new — opens from "Help run this")

Shows the breakdown at the minimum headcount, for example Boxing Intro:

    12 people × €12            €144.00
    Coach                      − €50.00   (university hall: free)
    Platform fee 7%            − €10.08
    You keep                    €83.92
    Needs 1 host. A second host joins automatically above 20 people,
    and the earnings are split between you.

    If fewer than 12 sign up, nothing is charged. You don't lose anything.

Button "I'd help run this" → short form: first name, WhatsApp, optional email,
"Have you run something like this before?", consent checkbox. Saved against the
event.

## 7. After joining (replaces the "Success!" modal, ~line 1394)

- REMOVE the full-screen "Success!" modal.
- The card itself changes to "You're in ✓".
- PRICE QUESTION — a small sheet, on the first join and then every third:
  "Would you still come if it were €4?" Yes · No · Depends · Skip. Never blocks
  the join.
- CONTACT — once, after the first join, a banner: "Leave your WhatsApp and we'll
  tell you when one of your events is happening." WhatsApp (main), email
  (optional), consent checkbox:
  "We'll only use this to tell you when an event you picked is happening.
  Nothing else, and you can ask us to delete it any time."

## 8. My picks (new tab — replaces Your Hub)

- The events this visitor joined, each with its live progress and a Leave
  button.
- Their contact status: "We'll message you on +31 6…" or "Add your number".
- A share link carrying their code: "Share this — it gets to 12 sooner."
- Empty state: "Nothing picked yet" with a button back to Events.

## 9. Propose an event (replaces the Create Event form, ~line 495)

- REMOVE the long Create Event form (images, venue picker, dates).
- REPLACE with a one-minute form: what is it, category, rough price, how many
  people it needs, first name, WhatsApp, and "What would you need to make it
  happen?".
- It goes to the admin for approval. It does not appear in the feed until
  approved.

## 10. "I have a space" (footer link)

Name, type of space (room, hall, café, other), roughly how many people it fits,
contact. Saved to `venueOffers`.

## 11. Remove everything fake or unused

- "Boost Visibility" / promote modal with "Confirm & Pay" and the invented hubs
  ("Lansdowne Hub", "Central District", "Downtown Tech Park", "Westside
  Heights"), ~line 1288 and HUB_OPTIONS ~line 180.
- Wallet & Payouts and the Connect Stripe button (MoreModal, ~line 877).
- The fake notifications.
- The list-venue modal.

## 12. Admin page — /admin (new, only you and people you add)

- NUMBERS: visitors, total joins, people who joined at least one event,
  contacts left, average events picked per person, "help run" taps, space
  offers, proposals.
- FUNNEL: card seen → card opened → joined → contact left, with percentages.
- EVENTS TABLE sorted by joins: title, category, price, minimum, joins,
  progress bar, seen, opened, open-to-join %, help-run taps. Click a row to edit
  any field.
- BY QR POSTER: joins per `?src=` value.
- PRICE ANSWERS: yes / no / depends per event.
- LISTS: proposals (Approve turns one into a real event), helpers with contact
  details and which event, space offers, suggestions.
- BUTTONS: Remove events not in the list · Seed the 33 events · Mark
  Confirmed / Cancelled · Export CSV · Add or remove admins.
- Anyone else visiting /admin sees "Not authorised" and their own uid.

## 13. Data

- Only the 33 events in src/data/seedEvents.ts exist.
- Delete every old test event ("Watercolor Basics Workshop", "Jazz Under the
  Stars", "Test", "Test event", "Муравьиный бой", "Дд" and anything else not in
  the list), including their participants and comments.

## 14. Look

Keep the colours exactly: dark navy, indigo→purple for primary actions,
blue/cyan for progress, green for "this is happening". Change everything else
so it does not look AI-generated: the covers, the hierarchy, the buttons and the
motion, following the impeccable steps in AGORAX_BUILD_PLAN.md Phase 4.

## Skills for each section

Load these before working on the section. Say in one line which ones you used.

| Section | Skills |
|---|---|
| Before anything | `writing-plans`, then `executing-plans` |
| 1. Opening the app | `auth-implementation-patterns`, `systematic-debugging` |
| 2–5. Feed, navigation, card, detail | `impeccable` (document → critique → shape → build → animate → adapt), `interaction-design`, `responsive-design`, `tailwind-design-system`, `composition-patterns` (split new screens out of App.tsx into their own files instead of growing it) |
| 6–10. Organiser panel, after-join sheets, My picks, Propose, I have a space | `impeccable`, `interaction-design`, `react-state-management` (joined state, picks, contact status), `gdpr-data-handling` (every form that asks for a number or email), `humanizer` for all the copy |
| 11. Removing fake things | `code-simplifier` |
| 12. Admin page | `kpi-dashboard-design`, `react-best-practices`, `security-review` (only admins can read contact details) |
| 13. Data | `systematic-debugging`, `verification-before-completion` |
| 14. Look | `impeccable polish`, `impeccable audit` |
| All student-facing text | `humanizer`, `avoid-ai-writing` |
| Firestore rules | `security-review`, `gdpr-data-handling` |
| Before saying anything is done | `verification-before-completion` |
| Shipping | `deploy-to-vercel` |
