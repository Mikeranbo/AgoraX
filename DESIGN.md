---
name: AgoraX
description: Pick the events you'd actually go to in Groningen. When enough people want one, it happens.
colors:
  navy-ground: "#0f172a"
  action-indigo: "#6366f1"
  action-purple: "#a855f7"
  progress-indigo: "#818cf8"
  progress-cyan: "#22d3ee"
  happening-green: "#4ade80"
  happening-green-ink: "#86efac"
  text-strong: "#ffffff"
  text-body: "#cbd5e1"
  text-muted: "#94a3b8"
  text-faint: "#64748b"
components:
  button-primary:
    backgroundColor: "{colors.action-indigo}"
    textColor: "{colors.text-strong}"
  progress-fill:
    backgroundColor: "{colors.progress-indigo}"
  progress-fill-happening:
    backgroundColor: "{colors.happening-green}"
---

<!-- Captured 21 Oct 2026 from src/index.css and component usage, before the Phase 4 redesign.
     Colors are pinned by PRODUCT.md (Brand Commitments) and stay normative through the redesign.
     Typography, shape, elevation and component treatment below describe the incumbent world,
     which Phase 4 replaces; this file is rewritten from the built world when that phase finishes. -->

# Design System: AgoraX

## Overview

**Creative North Star: to be confirmed in the Phase 4 brief.**

The palette is the one fixed thing: a dark navy ground, an indigo-to-purple gradient that means
"act", a blue-to-cyan gradient that means "progress toward the minimum", and green that means
"this is happening". Everything else in the current build (glass panels with backdrop blur, neon
glows, Outfit display type over Inter, eight different corner radii, tracked 9–10px uppercase
labels) is the incumbent look, kept here as evidence of where the product starts.

**Key Characteristics:**
- Dark, phone-first, one column at 390px, widening to a grid on tablet and desktop.
- Colour carries meaning, not decoration: action, progress, reached.
- Every event card is distinguished by its own emoji and accent colour from the seed data.

## Colors

Four roles on a navy ground; each colour has one job and is not used for anything else.

### Primary
- **Action Indigo → Action Purple** (`action-indigo` → `action-purple`, 135°): the gradient on
  primary actions only ("I'd join", form submits). Nothing decorative uses it.

### Secondary
- **Progress Indigo → Progress Cyan** (`progress-indigo` → `progress-cyan`, left to right): the
  fill of every progress bar toward an event's minimum. Cyan alone marks secondary links.

### Tertiary
- **Happening Green** (`happening-green` for fills, `happening-green-ink` for text on navy): an
  event that has reached its minimum, and the visitor's own "You're in" state.

### Neutral
- **Navy Ground** (`navy-ground`): the page.
- **Text Strong / Body / Muted / Faint** (white → slate 300 → 400 → 500): headings, body copy,
  supporting copy, captions. Faint is the floor for any text a student must read.

### Named Rules
**The Pinned Palette Rule.** These colours do not change in a redesign (PRODUCT.md, Brand
Commitments). New work changes how they are used, never the hues.

**The One Meaning Rule.** Indigo→purple means "do this", blue→cyan means "how close", green means
"it's happening". A colour that shows up outside its meaning is a bug.

## Typography

**Incumbent:** Outfit (display) over Inter (body), loaded from Google Fonts. Heavy use of 9–11px
uppercase tracked labels. Both faces are on impeccable's list of training-data defaults; Phase 4
replaces the pairing.

## Layout

Phone-first single column (max 448px), widening to 672 / 896 / 1152px at the `sm` / `md` / `lg`
breakpoints with a 1 / 2 / 3-column card grid. A fixed bottom area holds the visitor's picks.

## Elevation & Depth

**Incumbent:** translucent "glass" panels (white at 5% over navy, 10% white border, backdrop
blur) layered on blurred colour blobs, with coloured glow shadows on primary buttons. Phase 4
replaces this; the replacement is recorded here when it is built.

## Shapes

**Incumbent:** eight radii in use (`rounded-lg` to `rounded-[40px]` plus pills). Phase 4 settles
one corner language.

## Do's and Don'ts

### Do:
- **Do** keep the four colour roles exactly as listed in the frontmatter.
- **Do** let each event's own emoji and accent colour make its card different from its neighbours.

### Don't:
- **Don't** introduce a new hue for decoration; the palette is pinned.
- **Don't** set text a student has to read below the Text Faint colour or below 12px.
