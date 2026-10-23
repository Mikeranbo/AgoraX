# Security Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the confirmed Firestore-rules weaknesses (public owner claim, contact-hash oracle, counter inflation, admin listing, loose schemas) without breaking the visitor or admin flows.

**Architecture:** All integrity is enforced in `firestore.rules`; the client is changed only so that its legitimate writes satisfy the stricter rules. Counters move only in the same write as the document they count, so `participantsCount == participant docs` and `organiserInterest == helper docs` hold by construction. View counters (impressions/opens) are analytics and use their own per-visitor marker, never mixed with participation writes.

**Tech Stack:** Firestore security rules v2, Firebase JS SDK 12, Vite/React 19, `@firebase/rules-unit-testing` on the Firestore emulator, vitest.

**Spec:** the user's request of 2026-10-23 (items 1–7) and the rules review in the same session.

## Global Constraints

- No deploy, no merge into `main`, no production data changes, no change to existing `admins/*` documents.
- No login screen; anonymous auth only (CLAUDE.md).
- Never double-count a participant; everything keyed by uid (CLAUDE.md).
- Existing `users/*` documents must keep working: validate only the fields a write changes.
- Rules tests run only against a `demo-` project id, so the emulator can never reach a real project.

## Review Focus

- A visitor whose counter has drifted to 0 while their participant doc exists must still be able to leave.
- A returning visitor (new session) must not see console errors on every card impression.
- `linkContact` (banner, organiser panel, proposals, space offers) must still save contact details.
- Viewers must still load the admin page (without contact data) instead of a wall of errors.
- Purge and seed (editor flows) must still work under the new participant/helper delete rules.

---

## Task 1: Regression tests first (red)
- [ ] Rename `scripts/test-bootstrap-rules.mjs` → `scripts/test-rules.mjs`; project id `demo-agorax`.
- [ ] Add one check per confirmed attack (bootstrap claim, contactKey get/create, mergeRequest create, join/leave loop, helper loop, impressions loop, admin list, analytics extra fields, users referredBy/shareCode tampering) plus legitimate flows (join, leave, rejoin, leave at drifted count 0, helper offer + resubmit, purge by editor, seed, contact save, erasure, consent toggle, price answer, display name).
- [ ] Run against the current rules; record which attack checks fail.

## Task 2: Rules
- [ ] Remove `meta/bootstrap` and the self-claim path; owners grant others only, never edit themselves; admin doc allowlist.
- [ ] `admins`: get own doc or owner; list owner only.
- [ ] `users`: read self or owner/editor; per-changed-field type/length checks; `shareCode` = uid[0:8] and set-once; `referredBy` set-once and well-formed.
- [ ] `contactKeys`: no get/list/create; owner of key may delete (erasure). `mergeRequests`: no create.
- [ ] Participants/helpers: create and owner-delete must move the event counter by exactly ±1 in the same write; a drifted counter at 0 may stay at 0 on leave; editors may always delete (purge).
- [ ] Event counter updates: participation step, interest step and view step are separate branches; view step needs a first-time `events/{id}/seen/{uid}` marker field.
- [ ] `analytics`: field allowlist, known payload keys only, bounded strings.

## Task 3: Client
- [ ] Gate: remove the claim-owner UI; `adminService`: remove `claimOwner`/`subscribeToClaimable`.
- [ ] Identity: stop contact-hash lookup, contact-key creation and all `mergeRequests` writes; keep erasure of legacy keys.
- [ ] `leaveEvent` / `submitHelperInterest`: read the event in the transaction and only decrement above 0.
- [ ] `bumpEventCounter`: write the seen marker with the counter; skip events already counted on this device.
- [ ] Admin data: viewers do not subscribe to `users`/`admins`; owners only see the admin list; host interest comes from helper docs; add "Recount from sign-ups" (editor) with a unit-tested pure function.

## Task 4: Tooling and docs
- [ ] Pin `firebase-tools` as a devDependency; `test:rules` uses `firebase emulators:exec --project demo-agorax`; document JDK 21+.
- [ ] `docs/SECURITY.md`: trusted admin provisioning, production bootstrap check, migration, deployment plan.
- [ ] npm audit triage (runtime vs dev tooling).

## Task 5: Verify
- [ ] lint, build, unit tests, rules tests; red→green evidence for each attack check.
