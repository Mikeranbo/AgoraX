# AgoraX

React 19 + TypeScript + Vite 6, Firebase (Auth + Firestore), Tailwind v4,
motion/react, lucide-react. Deployed on Vercel. Entry: src/main.tsx -> src/App.tsx.

This build is a demand-validation landing page. Students reach it by scanning a QR
code on posters around the University of Groningen, browse events, and register
interest. Order of work: AGORAX_BUILD_PLAN.md. Exact screen changes: APP_CHANGES.md.
Feature spec: CLAUDE_CODE_PROMPT.md.
Product context: PRODUCT.md.

## Hard rules

- No login screen, ever. Anonymous Firebase auth only.
- Never double-count a participant. Everything is keyed by uid. Counters move only in the same
  write as the document they count (firestore.rules); run `npm run test:rules` after any rules change.
- No self-service admin claim, no contact-hash lookups, no account linking from a typed
  email/phone or a client-reported uid (docs/SECURITY.md).
- Do not take payments. Do not promise dates for events that do not exist yet.
- Keep the dark theme: `glass`, `brand-primary`, rounded-3xl cards.
- src/data/seedEvents.ts is the source of truth for the 33 events. Do not invent
  events or change prices without being asked.

## Skills - always check them first

This project has 48 skills in .claude/skills/. The full list with descriptions is in
.claude/skills/INDEX.md.

Before any non-trivial task:
1. Read .claude/skills/INDEX.md and pick 1-4 skills that fit the task.
2. Actually load them and follow them - do not just name them.
3. Say in one sentence which skills you used. If none fit, continue normally.

Always use:
- writing-plans before any multi-file change, then executing-plans.
- verification-before-completion before saying anything is done.
- impeccable or ui-ux-pro-max for any visual work. Never ship default
  Tailwind-looking UI.
- humanizer or avoid-ai-writing for any text a student will read.
- gdpr-data-handling before touching contact details or analytics.
- systematic-debugging for any bug, instead of guessing.

## Commands

npm run dev    - local dev server on port 3000
npm run lint   - tsc --noEmit
npm run build  - production build
