# Add this to CLAUDE.md

Without this rule Claude Code only uses a skill when it happens to think of one.
Paste the block below at the end of `.claude/CLAUDE.md` in this project
(create the file if it does not exist).

```
## Skills — always check them first

This project has 48 skills in .claude/skills/. The full list with descriptions
is in .claude/skills/INDEX.md.

Before any non-trivial task:
1. Read .claude/skills/INDEX.md and pick 1-4 skills that fit the task.
2. Actually load them and follow them — do not just mention them.
3. Say in one sentence which skills you used. If none fit, continue normally.

Always use:
- writing-plans before any multi-file change, then executing-plans.
- verification-before-completion before saying anything is done.
- impeccable or ui-ux-pro-max for any visual work. Never ship default
  Tailwind-looking UI.
- humanizer or avoid-ai-writing for any text a student will read.
- gdpr-data-handling before touching contact details or analytics.

## This project

AgoraX — React 19 + TypeScript + Vite 6, Firebase (Auth + Firestore),
Tailwind v4, motion/react, lucide-react. Deployed on Vercel.

Hard rules:
- No login screen, ever. Anonymous Firebase auth only.
- Never double-count a participant: everything is keyed by uid.
- Do not take payments. Do not promise dates for events that do not exist.
- Keep the dark theme (glass, brand-primary, rounded-3xl).
```
