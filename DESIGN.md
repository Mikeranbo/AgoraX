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

**Creative North Star: the sign-up list (*intekenlijst*).** Every student-association door in
Groningen has a sheet with numbered lines; when enough lines are filled, the trip happens. Each
event in AgoraX is that sheet: its minimum drawn as numbered places, filled places in the progress
colour, the event's own accent as the coloured paper at the top.

- Flat sheets (`sheet` on `navy-ground`, 1px `sheet-line` border). No glass, blur, glow or
  decorative gradients. The old `.glass` classes now render as flat sheets.
- One corner radius, `rounded-sheet` (14px). The places themselves are square, like boxes on paper.
- Phone first at 390px: one column, 2–3 lists per screen; 2 columns from 640px, 3 from 1024px.

## Colors

Each colour has one job.

- **Action** (`action-indigo` → `action-purple`, 135°): "I'd join" and form submits only. The label
  is 19px bold so white text stays readable on both ends of the gradient (WCAG large text).
- **Progress** (`progress-indigo` → `progress-cyan`): filled places, shaded left to right across
  the list. Cyan alone marks secondary links ("Help run this", "I have a space").
- **Happening** (`happening-green`, ink `happening-green-ink`): every place once an event reaches
  its minimum or is confirmed in /admin, and the "This is happening" label.
- **Event accent**: each event's own colour, mixed 50% into navy for the header band so white
  text passes contrast. It is the only colour outside the four roles.
- Text: white for headings and numbers, `text-body` for paragraphs, `text-muted` for secondary
  lines. Nothing smaller or fainter carries information.

## Typography

- **Bricolage Grotesque** for titles, numbers, counts and buttons (tabular figures on counts).
- **System font** for body text, so paragraphs load nothing extra.
- Body 15–16px, meta 14px, the smallest text (place numbers) 12px. No tracked uppercase labels.

## Components

- **Event card** (`src/components/EventCard.tsx`): accent band with emoji and title (and "Spring
  trip" or "This is happening"), meta line "€12 · 1.5 h · needs 12" with "Closes 10 Nov", the
  sign-up list, one primary button, then "Help run this · keep ~€84" as a quiet link.
- **Sign-up list** (`src/components/SignupList.tsx`): up to 12 places on one line, otherwise rows of
  10 (the largest minimum, 24, is three rows). States: default "8 of 12 — 4 more and this runs";
  close to the minimum (≤3 left or ≥75%) leads with "**3 more** and this runs"; joined puts a
  check in solid action indigo on your place; running turns every place green and adds "+N after
  it filled".
- **Sheets** (`src/components/Modal.tsx`): slide up from the bottom, 88dvh at most.
- **Tab bar**: Events · (+) Propose · My picks, fixed to the bottom, 56px targets.

## Motion

One authored moment, all of it off or reduced under `prefers-reduced-motion`
(`MotionConfig reducedMotion="user"`, CSS delays set to 0):

- The first time a list is on screen in a visit, its places fill left to right while the count
  counts up (0.6s, `cubic-bezier(0.16, 1, 0.3, 1)`).
- Tapping "I'd join" stamps a check onto your place (0.22s).
- Reaching the minimum sweeps the places to green, one after another.

Sheets slide in over 0.32s. Nothing else moves on its own.

## Do's and Don'ts

- Do keep the count toward the minimum the most visible thing on every card.
- Do keep every control at least 44px tall and every text 12px or larger.
- Don't add countdowns, "N people viewing", stock photos or a ticket emoji.
- Don't put two equal buttons on a card; helping run an event is a link.
- Don't use the action gradient for anything but actions.
