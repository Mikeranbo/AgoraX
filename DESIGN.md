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

Event cards float on a sketchbook board made of two fixed layers. The base is a gradient from
navy into the brand indigo (blue) and purple with a faint cyan glow. Above it, the same palette
runs the other way (purple → indigo → cyan) as one viewport-wide gradient that shows only through
the hollow outlines of three mask tiles: two hand-wobbled doodle tiles (1400px and 1130px,
regenerate with `python scripts/make-doodles.py`) and a tile of graffiti-style outlines (stars, a
crown, a bolt, a drip throw-up, speech bubble, sparkles; `src/assets/graffiti.svg`), all at
unrelated sizes and offsets so the repeat never shows. The drawings read as a reversed-colour layer
showing through, not as coloured icons; nothing is filled, nothing moves, and the layer never takes
clicks. Browsers without CSS masks get the old faint doodles. Long text always sits on a `sheet`
surface above it. Cards, sheets, the filter bar and the tab bar are flat `sheet` surfaces with a
soft shadow. One corner radius, `rounded-sheet` (14px).

## Opening view

Every visit to "/" starts with a full-screen view: "Help choose which events happen next." at
clamp(48px, 11vw, 120px), then the pilot explainer on a sheet (16px, three short paragraphs: a
pilot, not a booking service; ideas, prices and earnings are estimates; we aim to run 1–3 of the
best-supported events; interest is no booking, no payment, no guarantee) and one button down to
the list. Visitors who already said they're interested get a 64dvh version with their count and a
one-line reminder. The variant is decided once per load, so an interest never makes it jump.

## Colors

- **Action** (`action-indigo` → `action-purple`, 135°): "I'd join" and form submits only, label
  19px bold so white text stays readable on both ends.
- **Progress** (`progress-indigo` → `progress-cyan`): the bar toward an event's target. Cyan alone
  marks secondary links.
- **Confirmed** (`happening-green`): the bar and the "Confirmed" badge, only for events an admin
  confirmed in /admin. Reaching the interest target alone is shown as "Target reached · not
  confirmed yet" with the normal progress bar, never green.
- The board mixes indigo and purple only 26% into navy, so white and slate text on it pass AA.

## Typography

Bricolage Grotesque for display, headings, prices and buttons; the system font for body text. The
scale jumps instead of stepping: opening headline 56–140px → category headings 32–56px bold → card
titles 23px → body 14–16px → chips and facts 13px. Detail screen: title 40–76px over the photo,
price 40px, facts 13–14px. Headlines run wider than the card column; body stays under 60ch.

## Event card (`src/components/EventCard.tsx`)

1. Photo header (`src/data/photos.ts`, free Unsplash photos per seed event; an event's own
   imageUrls win; the emoji on the event's colour if a photo fails). "Proposal" or "Confirmed",
   category and "Spring trip" chips top left, the save toggle top right, the date bottom right:
   "Date to be confirmed" unless the event is Confirmed with a confirmed date
   (`src/data/schedule.ts`, shown in Europe/Amsterdam time with its zone).
2. Title, then two lines of description.
3. People line: "8 interested · target 12" from real sign-ups only, initials of people who chose
   to show them (opt-in, one letter, never more than five circles), and the bar underneath.
4. Price large on the left with "indicative price" under it, "I'm interested" on the right;
   interested shows "Interested" and "Withdraw".
5. Quiet links: "Help run this · est. €84 for a host", and "Show/Hide my initial" once interested.

The detail screen reuses the same parts with a taller photo and a floating price + join bar.

## Motion

The progress bar fills the first time it is on screen in a visit (0.8s,
`cubic-bezier(0.16, 1, 0.3, 1)`); sheets slide in over 0.32s. All of it reduced under
`prefers-reduced-motion` via `MotionConfig reducedMotion="user"`.

## Don'ts

- No countdowns, "N people viewing", invented popularity, scarcity, reviews or earnings, or a hidden price.
- No booking language for proposals: "I'm interested", never "Buy ticket" or "Booking confirmed".
- No blur or glass; depth comes from the shadow under flat sheets.
- Don't use the action gradient for anything but actions.

## Navigation

A menu button top left opens the sidebar; the avatar top right opens the account menu.
Laptop (≥1024px): the 320px sidebar sits beside the page while open and is fully hidden (no
reserved width) when closed with its × or the menu button; the choice is remembered on the device.
Phone: the bottom bar (Proposals · Propose · Interests) stays, and the sidebar is an overlay
drawer that closes on Escape, a tap outside or a choice; focus moves into it and back to the menu
button, and the page behind is inert.
Sidebar (where to go): Discover (all proposals, categories, scheduled events), Mine (my
interests, saved events), Requests (propose, my proposals, I have a space, invite), Organiser
tools (only in Organise/Both mode), Help (how the pilot works, FAQ, privacy notice, contact), a
collapsed "Ideas we're considering" with the locked feature votes (`locked_feature_click`,
`feature_vote`, ranked on /admin), and Admin for admins.
Account menu (about you): profile, Attend/Organise/Both, notification preferences, privacy & my
data, account & security, privacy notice. Nothing appears in both. Every screen ends with a footer
linking the privacy notice, how the pilot works, FAQ and contact.

## Event photos

Proposals and the admin editor share one picker (`src/components/ImagePicker.tsx`): upload (or drop)
a file, paste an https link, or pick an idea. Ideas are our own photos of the same category, then free
pictures from Wikimedia Commons and Openverse matched to the title, each source with an 8 s limit.
Uploads and picked ideas are shrunk to a ≤180 KB JPEG stored with the proposal, so nothing depends on
a third-party link. CC BY / BY-SA credits travel with the picture and show on the event page.
