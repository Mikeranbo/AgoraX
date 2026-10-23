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

Event cards float on a sketchbook board: a fixed gradient from navy into the brand indigo and
purple with a faint cyan glow, under two hand-wobbled doodle tiles of unrelated sizes (1400px and
1130px, offset) so the repeat never shows. Large drawings carry detail (a Dutch bike with spokes and a
basket, the Martinitoren with windows and clock, a guitar with strings, canal houses), medium ones
are the events' things, small ones are a few strokes; they rotate and overlap. Regenerate with
`python scripts/make-doodles.py`. Cards, sheets, the filter bar and the tab bar are flat `sheet`
surfaces with a soft shadow. One corner radius, `rounded-sheet` (14px).

## Opening view

Every visit to "/" starts with a full-screen view: "Pick the events you'd actually go to." at
clamp(56px, 14vw, 140px), leading 0.88, then one 15px line and one button down to the list (tapping
anywhere also scrolls there; the page snaps to the list). Visitors who already picked something get a
64dvh version with their count. The variant is decided once per load, so a join never makes it jump.

## Colors

- **Action** (`action-indigo` → `action-purple`, 135°): "I'd join" and form submits only, label
  19px bold so white text stays readable on both ends.
- **Progress** (`progress-indigo` → `progress-cyan`): the bar toward an event's target. Cyan alone
  marks secondary links.
- **Happening** (`happening-green`): the bar and the "This is happening" badge once the target is
  reached or the event is confirmed in /admin.
- The board mixes indigo and purple only 26% into navy, so white and slate text on it pass AA.

## Typography

Bricolage Grotesque for display, headings, prices and buttons; the system font for body text. The
scale jumps instead of stepping: opening headline 56–140px → category headings 32–56px bold → card
titles 23px → body 14–16px → chips and facts 13px. Detail screen: title 40–76px over the photo,
price 40px, facts 13–14px. Headlines run wider than the card column; body stays under 60ch.

## Event card (`src/components/EventCard.tsx`)

1. Photo header (`src/data/photos.ts`, free Unsplash photos per seed event; an event's own
   imageUrls win; the emoji on the event's colour if a photo fails). Category chip top left,
   "This is happening" badge top right, "Closes 10 Nov" bottom right.
2. Title, then two lines of description.
3. People line: "8 joined · target 12", initials of joiners who chose to show them (opt-in, one
   letter, never more than five circles), and the bar underneath.
4. Price large on the left, "I'd join" on the right; joined shows "You're in" and "Leave".
   Joining stays open after the target is reached.
5. Quiet links: "Help run this · keep ~€84", and "Show/Hide my initial" once joined.

The detail screen reuses the same parts with a taller photo and a floating price + join bar.

## Motion

The progress bar fills the first time it is on screen in a visit (0.8s,
`cubic-bezier(0.16, 1, 0.3, 1)`); sheets slide in over 0.32s. All of it reduced under
`prefers-reduced-motion` via `MotionConfig reducedMotion="user"`.

## Don'ts

- No countdowns, "N people viewing", or a hidden price.
- No blur or glass; depth comes from the shadow under flat sheets.
- Don't use the action gradient for anything but actions.

## Navigation

Laptop (≥1024px): a permanent 320px sidebar on the left; the bottom bar is hidden. Phone: the bottom
bar (Events · Propose · My picks) stays, and the avatar button top left slides the same sidebar in.
Sidebar groups: Me, Social, Discover, Create, Settings, Help, Admin (admins only). Items that are not
built yet are muted with a lock and "Coming soon"; tapping one opens "Not available yet — we're
building it." with "I want this". Taps (`locked_feature_click`) and votes (`feature_vote`) rank them
under "Most wanted features" on /admin.

## Event photos

Proposals and the admin editor share one picker (`src/components/ImagePicker.tsx`): upload (or drop)
a file, paste an https link, or pick an idea. Ideas are our own photos of the same category, then free
pictures from Wikimedia Commons and Openverse matched to the title, each source with an 8 s limit.
Uploads and picked ideas are shrunk to a ≤180 KB JPEG stored with the proposal, so nothing depends on
a third-party link. CC BY / BY-SA credits travel with the picture and show on the event page.
