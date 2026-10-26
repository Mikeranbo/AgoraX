---
name: AgoraX
description: Pick the events you'd actually go to in Groningen. When enough people want one, it happens.
colors:
  navy-ground: "#0f172a"
  sheet: "#18213a"
  sheet-line: "#2a3654"
  action-indigo: "#6366f1"
  action-purple: "#a855f7"
  progress-indigo: "#818cf8"
  progress-cyan: "#22d3ee"
  happening-green: "#4ade80"
  happening-green-ink: "#86efac"
  text-strong: "#ffffff"
  text-body: "#cbd5e1"
  text-muted: "#94a3b8"
typography:
  display: "Bricolage Grotesque Variable (self-hosted via @fontsource)"
  body: "system UI stack"
radius:
  sheet: "14px"
components:
  button-primary:
    background: "linear-gradient(135deg, {colors.action-indigo}, {colors.action-purple})"
    textColor: "{colors.text-strong}"
    font: "display 19px bold"
  place-filled:
    background: "{colors.progress-indigo} → {colors.progress-cyan} across the list"
  place-happening:
    background: "{colors.happening-green}"
---

<!-- Rewritten 22 Oct 2026 from the built world (Phase 4). Tokens live in src/index.css @theme. -->

# Design System: AgoraX

## Overview

Event cards float on a fixed board: a page gradient (#171C36 → #1E2450 → #2A2B60 → #352A66, top to
bottom) under `<DoodleBackground />`, "Background 1 · Even scatter": about sixty lucide outline
drawings (sports, music, food, travel, games, weather, hobbies) plus ~22% tiny filler shapes, spread
by a seeded layout with no overlaps (12px apart), sizes 30–84px (fillers 16–26px), rotated ±25°,
1.8px non-scaling strokes, coloured by height from purple at the top (rgb 133,96,216) to blue at
the bottom (rgb 88,118,224), layer opacity .9. It is recalculated on resize (cached per size) and
never takes clicks. The native scrollbar is hidden; `<ScrollRail />` draws a decorative 6px rail
with a 12×48px gradient handle. Sheets and the laptop filter bar are flat `sheet` surfaces with a
soft shadow. One corner radius for the event page, `rounded-sheet` (14px).

## Entry flow (`src/components/entry/`)

1. **Opening messages** (`EntryFlow`, `CubeText`): full screen, no scroll. Three messages
   ("Meet new, like-minded people." / "Have fun trying new activities." / "Earn money organising
   events."), each a whole face of an invisible cube that rolls around the X axis every 5.2s
   (1.35s, `cubic-bezier(.7,-0.2,.25,1.15)`); three messages on four faces. Headline Archivo 800 at
   110% width, block width ÷ 7.8 (about 114px at 1440 wide); text Archivo 500, 28px. A photo per
   message on the right third (top 40% on phones), crossfading in sync. Three message dashes top
   right (clickable), a "Scroll to explore" cue bottom centre. The cube rolls on its own, and
   scrolling down (wheel, trackpad, swipe up, mouse drag, ↓/PageDown/Space or the cue) rolls it to
   the next message instead of moving the page; up goes back a message, and does nothing on the
   first. One gesture is one message: after a step, input is ignored until it has been quiet for
   220ms and at least 650ms have passed (trackpad inertia), and a held key counts once. Any change
   of message restarts the 5.2s timer. Only once all three messages have been on screen (by timer,
   scroll or dash) does the next scroll move on to the notice. Rolling pauses on hover/focus;
   reduced motion crossfades instead.
2. **Pilot notice** (`PilotNotice`): frosted panel over the blurred events page; only "Got it —
   explore" and "Got it — don’t show again" (`localStorage['agorax.pilotNotice.hidden']`) close it.
   Scrolling, Escape or an outside tap can't. "About the pilot" in the menu reopens it.
3. **The events page**, growing from 0.97 to full size as the notice closes.

A reload in the same tab skips the opening (`sessionStorage['agorax.entry.done']`); a shared event
link (`?e=`) skips the messages but still shows the notice on a first visit; /privacy, /terms,
/cookies and /imprint open straight on their page.

## Colors

- **Action** (`action-indigo` → `action-purple`, 135°): "I'd join" and form submits only, label
  19px bold so white text stays readable on both ends.
- **Progress** (`x-blue` → `x-purple` on cards): the thin bar toward an event's target. Cyan alone
  marks secondary links.
- **Confirmed** (`happening-green`): the bar and the "Confirmed" badge, only for events an admin
  confirmed in /admin. Reaching the interest target alone is shown as "Goal reached · N
  interested · not confirmed yet" with the normal progress bar, never green.
- The board mixes indigo and purple only 26% into navy, so white and slate text on it pass AA.

## Typography

Entry flow and opened event: Archivo (variable, self-hosted; headlines 800 at 110% width, body 500),
logo and buttons Plus Jakarta Sans 800. No thin weights, no italics anywhere. The events page keeps
Bricolage Grotesque for display, headings, prices and buttons and the system font for body text. The
scale jumps instead of stepping: opening headline 56–140px → category headings 32–56px bold → card
titles 23px → body 14–16px → chips and facts 13px. Detail screen: title 40–76px over the photo,
price 40px, facts 13–14px. Headlines run wider than the card column; body stays under 60ch.

## Event card (`src/components/EventCard.tsx`)

Compact, Meetup-style: a wide rounded picture (2:1, radius 18px, the page's 16px side margins)
with the details right under it. No border or shadow; only a light navy tint (`#12163a` at 80%)
behind the card so the doodles don't run through the text. 24px between cards.

1. Photo (`src/data/photos.ts`, free Unsplash photos per seed event; an event's own
   imageUrls win; the emoji on the event's colour if a photo fails). "Proposal" or "Confirmed",
   category and "Spring trip" chips (12px) top left, the save toggle (20px icon, 36px tap area)
   top right, the date bottom right: "Date to be confirmed" unless the event is Confirmed with a
   confirmed date (`src/data/schedule.ts`, shown in Europe/Amsterdam time with its zone).
2. Title (19px) directly under the photo, then two lines of description (13.5px).
3. Sign-up progress: "7 of 12 needed to run" from real sign-ups only ("Goal reached · 12
   interested · not confirmed yet" at the target; "N interested · target M" once confirmed),
   initials of people who chose to show them (opt-in, one letter, never more than five circles),
   and a 5px bar underneath.
4. Price (24px) on the left with "indicative price" under it, "I'm interested" (40px tall) on the
   right; interested shows "Interested" and "Withdraw".
5. Quiet links: "Organize · est. €84 for a host" (opens the event page), and "Show/Hide my
   initial" once interested. The photo, the title or Organize open the event page.

## Opened event (`src/screens/EventDetail.tsx`, "Cinematic")

Full-screen photo (object-position 72% 40%) with the soft-light purple/blue tint and fades into
#07081A. Left column: "PROPOSAL · CATEGORY • DATE TO BE CONFIRMED", the title (Archivo 800, up to
84px), a cyan→purple rule, the description (20px), pills for date, venue and duration, "I’m
interested" (gradient pill; "✓ Interested — withdraw" once in) and "Organize · est. €X" (outline;
opens the organiser sheet and shows "We’ll contact you about a possible collaboration. This doesn’t
make you the organiser."), and "Prices and potential earnings are hypothetical — not promises."
Bottom bar: interested / target, indicative price, est. host earnings in 54px numerals, and the
shown initials plus dashed empty places with "X more to reach the target". Back, Save and Share at
the top. Phones: photo across the top 62%, stats as a 3-column grid. Details (you bring, hosts,
organiser, map link, photo credit) follow below.

## Motion

The progress bar fills the first time it is on screen in a visit (0.8s,
`cubic-bezier(0.16, 1, 0.3, 1)`); sheets slide in over 0.32s. All of it reduced under
`prefers-reduced-motion` via `MotionConfig reducedMotion="user"`.

## Don'ts

- No countdowns, "N people viewing", invented popularity, scarcity, reviews or earnings, or a hidden price.
- No booking language for proposals: "I'm interested", never "Buy ticket" or "Booking confirmed".
- No blur or glass on the events page; depth comes from the shadow under flat sheets. The only
  frosted surfaces are the pilot notice and its veil, and the entry cue.
- Don't use the action gradient for anything but actions.

## Navigation

A menu button top left opens the sidebar. There is no avatar top right: the profile card at the
bottom of the sidebar holds the personal settings.
Laptop (≥1024px): the 320px sidebar sits beside the page while open and is fully hidden (no
reserved width) when closed with its × or the menu button; the choice is remembered on the device.
Phone: the bottom bar (Proposals · Propose · Interests; slim, 22–24px icons, 12px labels) stays,
and the sidebar is an overlay drawer that closes on Escape, a tap outside or a choice; focus moves
into it and back to the menu button, and the page behind is inert. The menu button is 40px. On the
proposals page it sits at the left of a solid strip across the top with search and the category
chips (34px, 14px text); on other pages the same strip appears behind it once the page scrolls.
Cards scroll under the strip, so no control ever floats over a picture or title. The opened
event's back, save and share buttons are 36px.
Sidebar: Proposals, Scheduled events, My interests (count), Saved events, Report a bug (an email
with the questions we need) and About the pilot; then a collapsed "More" (propose, my proposals, I
have a space, invite, organiser profile, how the pilot works, FAQ, contact, Admin for admins) and the
collapsed "Ideas we're considering" with the locked feature votes. Categories live only in the chip
bar above the list. The profile card at the bottom opens profile, Attend/Organise/Both,
notification preferences, privacy & my data, account & security and the privacy notice.
Every screen ends with the footer card (radius 28px): Company, Legal (Privacy Policy, Terms of Use,
Cookie Policy, Imprint), Support, Contact, and © 2026 AgoraX with registration number and VAT ID.
Company facts that aren't confirmed yet show "to be confirmed" (`src/config/legal.ts`); Terms,
Cookie Policy and Imprint are placeholder pages that say they're not written yet.

## Event photos

Every seed event and every entry message has a real, licensed photo served from this site
(`public/images`, never hotlinked): Unsplash originals, each checked as "Free to use under the
Unsplash License", listed with photographer and page in `scripts/photo-sources.json` and credited in
`public/images/CREDITS.md`. `node scripts/build-photos.mjs` makes AVIF and WebP at 640, 1280, 1920
and 2560px (never enlarged) and `src/data/photoManifest.ts`; `<Photo />` serves them as `<picture>`
with srcset, sizes, width and height (entry photos eager with fetchpriority high, the rest lazy).
Profiles use initials, no stock faces.


Proposals and the admin editor share one picker (`src/components/ImagePicker.tsx`): upload (or drop)
a file, paste an https link, or pick an idea. Ideas are our own photos of the same category, then free
pictures from Wikimedia Commons and Openverse matched to the title, each source with an 8 s limit.
Uploads and picked ideas are shrunk to a ≤180 KB JPEG stored with the proposal, so nothing depends on
a third-party link. CC BY / BY-SA credits travel with the picture and show on the event page.
