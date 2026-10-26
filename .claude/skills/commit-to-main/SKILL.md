---
name: commit-to-main
description: Use at the end of every task the user asked for that changed files - verify, commit, and get it onto main (pushed, so it deploys) unless the user said not to or it would break the live site; in that case say so explicitly and why. Work on main directly; never create feature branches unless asked.
---

# Finished work goes to main

The owner's standing rule: when a task they asked for is done, it is committed and on `main`,
pushed. Pushing `main` deploys the live site (Vercel), so this is how work ships. No feature
branches piling up.

## When

- At the end of every task that changed files, before the final message. Also when several asks
  come in one message: ship once, after all of them.
- Not for pure questions or analysis with no file changes, and not halfway through a task.

## Steps

1. **Stay on `main`.** Don't create branches unless the user asks for one. If you find yourself on
   another branch (older work), the result still ends up on `main` in step 5.
2. **Verify first** (see `verification-before-completion`). For this project: `npm run lint`,
   `npm test`, `npm run build`, and `npm run test:e2e` when the change touches pages or flows
   (it needs Java for the emulators; stop any local emulator/preview first, it uses the same
   ports). Read the output; don't assume.
3. **Check what goes in.** `git status` and `git diff`: only files that belong to the task. Never
   commit secrets (`.env*`, keys, service-account JSON), caches (`.cache/`), scratch files or
   screenshots that aren't part of the site.
4. **Commit** with a clear message: what changed and why (`commit` skill for the format), plus
   any attribution lines the session requires.
5. **Onto main and push.**
   - On `main`: `git pull --ff-only origin main`, then `git push origin main`.
   - On a branch: `git checkout main && git pull --ff-only origin main && git merge --ff-only <branch>`
     (a normal merge if it can't fast-forward; resolve conflicts properly), `git push origin main`,
     then delete the merged branch locally and on the remote.
   - Never force-push `main`. Never delete branches kept on purpose (e.g. `backup/*`).
6. **Check the deploy.** Wait until the live site serves the new build, then do a quick read-only
   look (no sign-ups, interest clicks or form submits on production; block Firebase requests in a
   test browser so a check creates no data).

## When not to — and say it plainly

Only skip the commit/merge/push when:

- the user said not to (for this task, or "don't push yet"), or
- it would break the live site: a failing type check, test or build; a change that needs
  something live first (new Firestore rules, env vars, a migration) that isn't deployed yet;
  secrets in the diff; or work that is unfinished.

Then the final message must say, near the top, that it was **not** committed or merged, the
concrete reason (which check failed and how, or what has to be deployed first), and what is
needed to finish. Never leave it unsaid, and never call such work done.

Firestore rules are deployed separately (`firebase deploy --only firestore:rules`) and only after
the owner says so; if a change depends on new rules, that is a "not yet" case above.

## Report

In the final message: the commit hash, that it is on `main` and pushed, and whether the deploy is
live (with the URL).
