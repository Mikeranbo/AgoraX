# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

University students in Groningen, mostly 18–25, Dutch and international, who
reach the page by scanning a QR code on a poster around the University of
Groningen and Hanze campus. They are on a phone, standing up, between classes or
in a dorm, with 30–60 seconds of attention.

Secondary: students who might organise a small event themselves if the
financial risk were removed, and people who manage a room or space (student
associations, community halls, cafés).

## Product Purpose

AgoraX is a marketplace for conditional events: an event only happens if enough
people sign up before a deadline. If the minimum is not reached it is cancelled
and nobody pays.

This build is a demand-validation landing page, not the full product. Its job
is to find out which niche events students would actually join, who would help
run them, and at what price, so the founder can run the top 2–3 events by hand
and use the results to apply to the Innokite incubator and raise a first round.

Success for this surface:
- a visitor picks at least one event they would join;
- leaves a WhatsApp number or email to be told when it runs;
- a small share tap "help run this" or "I have a space".

## Positioning

The minimum-participant threshold is the mechanism nobody else in Groningen
offers. The progress toward each event's minimum is real, public, and is the
thing that makes an event happen. It replaces the fake urgency other event and
shopping apps rely on.

## Operating Context

- Arrives from a QR code on a printed poster; each poster carries `?src=` so
  traffic can be traced to a location.
- Mobile-first: design for ~390px wide, then scale up.
- No account, no login. Anonymous Firebase auth identifies a returning phone.
- Students coordinate on WhatsApp, not email.
- The founder reviews results on a private `/admin` page and runs the winning
  events manually.

## Capabilities and Constraints

- Stack: React 19, TypeScript, Vite 6, Firebase (Auth + Firestore), Tailwind v4,
  motion/react, lucide-react. Deployed on Vercel.
- The 33 events and their prices, minimums, host counts and costs live in
  `src/data/seedEvents.ts`. That file is the source of truth.
- Prices shown are deliberately low to maximise signups. After a join, an
  optional skippable question asks whether they would still come at a higher
  price.
- Every event card offers "Help run this · keep ~€XX", computed from
  `organiserEarnings()` at the minimum headcount.
- No payments are taken. No dates are promised for events that have not reached
  their minimum.
- Contact details are personal data of EU students: collect only what is
  needed, with explicit consent text.

## Brand Commitments

- Keep the existing palette exactly: dark navy background, indigo-to-purple
  gradient for primary actions, blue/cyan gradient for progress, green for an
  event that has reached its minimum.
- Must not look AI-generated or template-like. Every card should look different
  from its neighbours through its own cover (emoji + accent colour from the seed
  data), not through decoration.
- Engaging through honest mechanics only: real progress bars, real deadlines,
  real state changes. No fake countdowns, no "N people viewing now", no invented
  scarcity, no spin-to-win.
- Voice: a student building something, humble but not begging. Plain, short,
  confident. No "please", no exclamation-mark enthusiasm, no startup jargon.

## Evidence on Hand

- 22 recorded student interviews and 1 organiser interview, summarised in
  `../../AgoraX-interviews.xlsx`. Key finding: 11 of 19 students with a hobby
  attended no event related to it in the previous month.
- Google Form survey responses in `../../AgoraX survey responses.xlsx`.
- No testimonials, partner logos, user counts or press exist. Do not invent any.
