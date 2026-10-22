# Security and GDPR review — Firestore rules v2 and contact forms

Skills: `security-review` (authorization, business-logic references), `gdpr-data-handling`.
Scope: `firestore.rules`, `src/services/{identity,firebaseService,adminService}.ts`, every form that
asks for a phone number or email (contact banner, help-run form, Propose, I have a space).

## Security findings

| ID | Severity | Status | Finding |
|---|---|---|---|
| SEC-1 | **High** | **Fixed** | Any signed-in visitor could move `participantsCount`/`joins` by ±1 as often as they liked without joining, so a script could inflate or wipe the number this test exists to measure. Now every ±1 must create/delete the caller's own `participants/{uid}` in the same write (`exists`/`existsAfter`), `joins` must move with it, `organiserInterest` needs a new `helpers/{uid}`, and `impressions`/`opens` only go up by 1. |
| SEC-2 | Medium | **Fixed** | `users/{uid}` accepted any fields of any size from its owner (mass assignment, unbounded docs). Now an allowlist plus length caps on name/email/phone. |
| SEC-3 | Medium | **Open** | Anonymous accounts are free to create, so a script can mint uids and join each event once per uid. Firebase's per-IP anonymous sign-in quota is the only limit. Mitigation: Firebase App Check (reCAPTCHA Enterprise) before the posters go up; meanwhile the admin "By QR poster" table shows joins per source, so a spike from `direct` with no visits is visible. |
| SEC-4 | Low | **Fixed** | `analytics.payload` had no size bound. Now a map with at most 12 keys. |
| SEC-5 | Low | Accepted | `contactKeys/{hash}` is readable by single `get`, so someone who already knows a phone number can learn that it was submitted and see an opaque uid. The uid grants no access. Kept, because duplicate detection needs it. |
| SEC-6 | — | **Fixed** | Comments were an anonymous public write surface (APP_CHANGES §5). Creation is now denied; admins can read and delete the old ones. |
| SEC-7 | — | Verified | No `dangerouslySetInnerHTML`/`innerHTML` in `src`; React escapes all rendered text. CSV export neutralises `= + - @` formulas (tested in `src/lib/csv.test.ts`). |

High findings unresolved: **none**.

## GDPR

**Data held**

| Where | What | Personal? | Purpose / legal basis |
|---|---|---|---|
| `users/{uid}` | first name, WhatsApp, email | yes | consent, recorded per purpose in `consents.{updates,organising,proposal,space}` with text version `v1` |
| `users/{uid}` | source poster, joins, price answers, share code | pseudonymous | running the demand test (legitimate interest) |
| `events/{id}/participants/{uid}` | price seen, source | pseudonymous | as above |
| `events/{id}/helpers/{uid}` | ran-before answer | pseudonymous | consent `organising` |
| `proposals`, `venueOffers`, `suggestions` | event idea / space type and size / free text | no contact fields | — |
| `contactKeys/{hash}` | SHA-256 of email/phone → uid | pseudonymous | duplicate detection |
| `analytics` | event names, uid, source | pseudonymous | measuring the funnel |

**Fixes made in this phase**

- Consent is per purpose and never bundled; each form shows its own sentence (`src/data/consent.ts`).
  The updates sentence is APP_CHANGES §7's wording, unchanged.
- Contact details live in one place (`users/{uid}`); helpers, proposals and space offers reference
  the uid instead of copying the number.
- The suggestion box no longer asks for a contact detail. It had no consent checkbox; anyone who
  wants a reply can use Propose, which has one.
- Self-service erasure: `deleteMyContact()` removes name, number, email and every consent from
  `users/{uid}` and deletes the visitor's own `contactKeys`. It will be the "Delete my details" button
  on My picks (Phase 4).
- Consent boxes start unticked; every validator refuses to send without consent (tested).

**Open — need the founder**

1. **Controller and contact.** Art. 13 needs a privacy note saying who holds the data and how to
   reach them. Which name and email or WhatsApp should it show?
2. **Retention.** Suggested: delete contact details 6 months after the test ends, or on request.
3. **Data location.** Check the Firestore database location in the Firebase console; if it is
   outside the EU, Google's Data Processing Terms (SCCs) cover the transfer, and the privacy note
   should say so.
4. **Analytics storage.** First-party, pseudonymous, no third parties. Dutch guidance generally
   treats this as low-impact analytics, but the privacy note should still mention it in one line.
