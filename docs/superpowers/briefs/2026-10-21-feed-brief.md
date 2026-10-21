# Design brief: the AgoraX event feed and its screens (draft for founder confirmation)

Mode: **Persuade**. Built with impeccable `shape`, degraded: the launcher (concept-seed, serve-question) did
not run, so directions were derived by hand from the audience's world rather than dealt by its roll.

## 1. Job and audience

A Groningen student, 18–25, standing up between classes or in a dorm, has just scanned a QR poster. They
have 30–60 seconds and one hand. They need to see, fast, which events exist, which ones are close to
happening, and that their tap moves a real count.

## 2. Outcome and proof

- **Primary action:** "I'd join" on at least one event (target: 40% of visitors).
- **Secondary:** leave a WhatsApp number (15%), "Help run this" or "I have a space" (5+ people).
- **Proof only AgoraX has:** the public count toward each event's minimum. It decides whether the event
  happens, and it is real. It must be the most visible thing on every card.

## 3. Selected direction — "The sign-up list" (*intekenlijst*)

Every student-association door in Groningen has one: a sheet with numbered lines; when enough lines are
filled, the trip or the game night happens. AgoraX is that sheet, online.

- **Each event is a sign-up list.** Its minimum is drawn as that many numbered places (6 to 24 in the seed
  data). Filled places fill with the blue→cyan progress colour; empty ones stay as outlined boxes. You can
  count what's left with your eyes; the line under it says it in words: "8 of 12 — 4 more and this runs".
- **The event's own colour is the list's header band**, like the coloured paper association sheets are
  printed on, with the emoji set large in it. That is what makes neighbouring cards look different.
- **Material:** flat, printed, slightly heavier sheets on the navy board. No glass, no blur, no glow, no
  gradients except the two pinned ones. One corner radius.
- **Pinned palette, used by meaning only:** navy = the board; indigo→purple = "I'd join" and submits;
  blue→cyan = filled places; green = this is happening.
- **What it refuses:** the category default (picture card, thin bar, two equal buttons, ×33) and its
  usual opposite (a cream-paper editorial page, which the pinned navy rules out anyway).

### The four card states

| State | What changes |
|---|---|
| **Default** | Filled and empty places; count line; "I'd join" primary, "Help run this · keep ~€84" as a quieter secondary link; meta line "€12 · 1.5 h · needs 12" and "Closes 10 Nov". |
| **Joined** | Your place is the newest filled one and carries "you" in solid indigo; the button becomes "You're in ✓" with a small "Leave". |
| **Close to its minimum** (3 or fewer places left, or 75%+) | The count line leads: "**3 more** and this runs", one weight heavier. Nothing blinks, no timer: the truth is just put first. |
| **Running** (minimum reached, or confirmed by you in /admin) | Every place turns green, the header gets "This is happening", and joins past the minimum add below the line ("+4 signed after it filled"). Joining stays open. |

### Alternates (not chosen, still on the table)

- **The tally sheet (*turflijst*).** Progress as tally marks in fives toward a ruled target line; very
  student-association. *Risk:* tally marks are slower to read than boxes, and harder for low vision and
  screen readers, so the number line would have to carry everything.
- **The departure board.** The feed as a station board: one row per event, a "needs 12" column and a status
  ("4 more" / "This is happening"), split-flap counting. Densest (8–10 events per screen). *Risk:* reads as a
  tool, and events stop looking different from each other (a colour stripe at most).
- **Standing exit — the familiar version.** Today's event-card feed, cleaned up: no glass, bigger progress,
  one primary button. Safe and quick; it stays in the AI-default family.

## 4. Scope and boundaries

- **In scope (APP_CHANGES §2–11):** feed top (copy, sticky chips, inline search filter), tab bar
  (Events · (+) Propose · My picks), event card and its four states, event detail (no comments; where,
  duration, included/bring, minimum, closing date, hosts, both actions), organiser panel and its form,
  price question sheet, contact banner, My picks, Propose, "I have a space", removing the fake leftovers.
- **Untouched:** the data layer and rules from Phases 2–3, the /admin page (an Operate surface, already
  rebuilt), the pinned colours, the 33 seed events and their prices.
- **Anti-goals:** glass/blur/glow, countdowns, "N people viewing", stock photos, a ticket emoji, two
  equal buttons per card, any colour outside the pinned roles plus each event's own accent.

## 5. States and ranges

33 events; minimum 6–24; counts 0 to ~60 (joins continue past the minimum); prices free–€25; durations
1 h–36 h; titles up to ~30 characters. Screens: empty feed (before seeding), a category with no events,
no picks yet, joining fails (offline / rules not published), contact already left, contact deleted, a
proposal sent, a space offer sent. Reduced motion everywhere.

## 6. Interaction and layout

- **390px first:** a short header (the question + the rule in one line), then sticky chips with a search
  field that filters the cards in place; 2.5–3 lists visible per screen (each about 220–260px).
- **Tablet/desktop:** the same lists in 2 and 3 columns; the header gets room, the lists don't stretch.
- **Motion (impeccable animate + interaction-design):** places fill left to right with the number counting up
  the first time a card scrolls into view (once per session); tapping "I'd join" stamps your place; reaching
  the minimum sweeps the places to green and lands the "This is happening" header. Nothing moves on its own
  after that. All of it off under `prefers-reduced-motion`.
- **Touch:** every control 44px or more; text 12px minimum.

## 7. Constraints and open decisions

- React 19, Tailwind v4, motion/react; new screens in their own files, `App.tsx` under 150 lines; the
  impression observer and analytics events stay as they are.
- **Typeface (needs your call):** Outfit and Inter are both on the "training-data default" list. I'd use
  **Bricolage Grotesque** for titles, numbers and buttons (printed-poster character, tabular figures, wide
  optical range) with the phone's own system font for body text, so nothing extra loads for paragraphs.
  Alternative: **Schibsted Grotesk** throughout, calmer and more newspaper-like.
- **"Help run this" weight:** I've made it a quieter secondary link under the primary button. If organisers
  matter as much as joiners for Innokite, it can stay a full button.
