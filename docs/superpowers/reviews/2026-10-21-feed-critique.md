⚠️ DEGRADED: single-context (this session spawns sub-agents only on explicit request; the impeccable detector binary is not installed, so Assessment B is live-browser measurement only)

# Critique: the event feed (`src/App.tsx` FeedView + `src/components/EventCard.tsx`), 21 Oct 2026

Evidence: mock-backend dev server, 390×844 and 1280 wide, plus source reading.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Progress and "You're in" are clear; a card close to its minimum looks like any other |
| 2 | Match system / real world | 2 | "this runs", "Runs" badge, "sourcing": the threshold idea is told once in a sub-line, never shown |
| 3 | User control and freedom | 3 | Leave is always one tap away; sheets close by tap-outside |
| 4 | Consistency and standards | 2 | Eight corner radii; two wordings for the same help-run action; mixed label styles |
| 5 | Error prevention | 3 | Joins are idempotent; forms validate and need consent |
| 6 | Recognition rather than recall | 3 | Picks strip shows the nearest pick; filters are visible |
| 7 | Flexibility and efficiency | n/a | Persuade surface |
| 8 | Aesthetic and minimalist design | 1 | Glass + blur + glow everywhere, two large buttons on all 33 cards, one event per screen |
| 9 | Error recovery | 3 | Toast on a failed join; inline form errors |
| 10 | Help and documentation | n/a | Persuade surface |
| **Total** | | **20/32** | **Acceptable (63%)** |

## Design Specificity Verdict

**LLM assessment:** category-interchangeable. Take the AgoraX words off and this is any dark "events app": rounded glass card, picture area, title, thin bar, two stacked buttons, repeated 33 times. The one thing nobody else in Groningen has — a public count toward a minimum that decides whether the event happens — is drawn as an 8px line, 1.7% of the card. The emoji covers do vary from card to card, as PRODUCT.md wants, but each sits small in an empty gradient block, which reads as a placeholder rather than a choice.

**Measured (Assessment B substitute):** 36 cards × 460px = 18,096px of scrolling at 390px (≈21 screens); 1 event fully visible in the first screen; cover is 35% of each card, progress 1.7%; 123 elements use backdrop blur; 80 controls are under 44px in one dimension (all category chips are 38px tall); 16 text elements under 12px; display/body faces are Outfit/Inter (both on impeccable's training-data-default list).

## Overall impression

It works and it is honest, but it looks like the template every AI tool ships for "dark event app", and it hides its own best idea. The single biggest opportunity: make the count toward the minimum the card.

## What's working

- The rule is right and plain: "Every event has a target. When enough people want one, we run it."
- Real per-event identity exists in the data (emoji + accent colour + exact costs), ready to be used harder.
- States are honest: no countdowns, no fake viewers, joining stays open past the minimum.

## Priority issues

- **[P1] Progress is the least visible thing on the card.** It is the product's mechanism and the reason to join now. *Fix:* make the count toward the minimum the dominant element of every card; drop the large picture block. *Command:* shape → bolder.
- **[P1] One event per screen.** A student with 30–60 seconds sees 2–4 events. *Fix:* compact cards so 2.5–3 events show at 390px; sticky category chips with an inline search. *Command:* layout, adapt.
- **[P1] The AI-default look.** Glass, blur, neon glow and Outfit/Inter are the "near-black with one neon accent and glowing edges" cluster. *Fix:* keep the pinned colours, remove glass, blur and glow, and give them a material from the students' own world; replace the typefaces. *Command:* shape (new world within the pinned palette), typeset.
- **[P2] Two equal-weight buttons on every card.** "Help run this" competes with "I'd join" 33 times. *Fix:* one primary action; help-run as a quieter secondary. *Command:* distill.
- **[P2] The four states are not designed.** Close-to-minimum and running look almost like default; joined only swaps buttons. *Fix:* design each state (brief covers them). *Command:* shape, animate.

## Persona red flags

- **Casey (distracted mobile user, QR scan between classes):** sees one event, the rule in small grey text, then has to scroll 460px per idea; chips are 38px tall; leaves before reaching the event they would have joined.
- **Jordan (first-timer):** "RUNS", "this runs", "help run this": the threshold idea is never shown, only said; doesn't learn that their join moves something.
- **Sam (accessibility):** 9–11px uppercase labels, slate-500 captions on navy, 38px chips; motion on the progress bar ignores reduced motion.

## Minor observations

- Category chips use 11px tracked uppercase; the rest of the page doesn't.
- The detail page still has comments (APP_CHANGES §5 removes them) and no closing date or host count.
- The contact banner says "Leave a number" (APP_CHANGES §7: "Leave your WhatsApp…").

Questions skipped: the build plan goes straight from critique into shape, and the founder's review point is the design brief.
