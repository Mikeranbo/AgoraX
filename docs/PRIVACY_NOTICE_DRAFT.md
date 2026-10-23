# AgoraX privacy notice: DRAFT for review

**Status: draft, not production-ready.** It is written from what the code on branch `pilot-ux`
actually does. It is not legal advice and has not been reviewed by anyone qualified. Saying this
notice exists does not make AgoraX compliant with the GDPR or Dutch law.

While it is a draft, the app does **not** collect the new kinds of personal data it cannot yet
cover: public profile text and pictures, organiser identity, and optional launch/invitation
emails. Those screens exist but stay off until `VITE_PRIVACY_NOTICE_FINAL=true` is set at build
time (see `src/config/pilot.ts`).

## Open facts and decisions (must be resolved before it is final)

1. **Controller identity.** The legal name of the controller (a person or an organisation),
   a postal address, and whether anyone shares decisions about the data (joint controller).
2. **Legal bases.** The proposed basis for each purpose (table below) needs review. In
   particular, whether visit statistics, which use browser storage and are on by default with
   an opt-out switch, need prior opt-in consent under the Dutch Telecommunicatiewet (art. 11.7a).
3. **Processors and transfers.** The Firestore data location (Firebase console → Firestore →
   location), Google's data processing terms and transfer safeguards, Vercel's terms, server
   location and log retention, and which email service messages are sent from.
4. **Retention.** Nothing is deleted automatically. The old in-app note promised "at the
   latest 12 months after your last visit"; no job does this. Decide a period (for example X
   months after the last visit or after the pilot ends) and how it is carried out.
5. **Cookies.** AgoraX sets none itself; confirm Vercel sets none.
6. **Minimum age.** The draft says 16; confirm.
7. **Manual contact.** Messages are sent by hand from WhatsApp or email. There is no mailing
   system, so there are no unsubscribe links; switching a preference off in the app is the
   opt-out. Confirm this is acceptable for the pilot, or set up a provider (see blockers in
   `docs/SECURITY.md` and the handoff).

## What the code actually collects (for the reviewer)

| Where | Fields | Who can read it |
| --- | --- | --- |
| Firebase Auth | Anonymous account id; Google processes IP and browser details at sign-in | Google |
| `users/{uid}` | first/last visit, source (poster code), share/referrer codes, interests mirror, saved events, timing preference, Attend/Organise/Both, price answers, private display name, contact details (name, email, phone) if given, consents (purpose, wording version, notice version, server time), public profile id | the person, admin editors/owners |
| `events/{id}/participants/{uid}` | joined at, price seen, source | the person, admins |
| `events/{id}/helpers/{uid}` | "ran something before?" answer, time | the person, admins |
| `events/{id}/faces/{uid}` | one opt-in initial | every signed-in visitor |
| `events/{id}/seen/{uid}` | first impression / open time (skipped when statistics are off) | nobody (write-only) |
| `analytics` | event name, event id, prices, booleans, scroll depth, feature votes (skipped when statistics are off); no contact details or free text | admins |
| `proposals` | idea fields, picture or link and credit, public profile id of the organiser | the author, admins |
| `suggestions` | free text (no contact asked) | admins |
| `venueOffers` | space type, capacity | admins |
| `profiles/{publicId}` (off while draft) | display name, bio, interests, area, picture, cover, organiser description | any signed-in visitor with the id |
| `profileOwners/{publicId}` | which uid owns a public id | nobody (write-only) |
| retired: `contactKeys`, `mergeRequests` | hashes of email/phone → uid; uid pairs | nobody / editors |
| Browser storage | Firebase sign-in (IndexedDB); `agorax_src`, `agorax_ref`, `agorax_city`, `agorax_sidebar`, `agorax_banner_dismissed`, `agorax_no_stats`, `agorax_counted` (localStorage); `agorax_session_once` (sessionStorage) | this browser only |
| Third parties loaded | Vercel (hosting), Unsplash (photos), Wikimedia Commons + Openverse (only when searching photos while proposing) | them |

Deletion that works today, tested in `src/services/clientFlows.emulator.test.ts`:
contact-details deletion, consent withdrawal per purpose, public profile deletion, and "Delete
my data and account". That last one withdraws interests and helper offers (the counts go down),
deletes drafts, the profile, contact details, settings, the `users` doc and the anonymous
account. Kept: sent proposals (on request only), anonymous suggestions/space offers,
analytics and view markers, which carry only the old random uid.

## The notice as shown in the app

<!-- notice:start (generated from src/data/privacyNotice.ts; run UPDATE_NOTICE=1 npx vitest run src/data/privacyNotice.test.ts) -->
> **Draft (draft-2026-10).** Draft for review. Some facts below are still to be confirmed, and the legal bases need checking by someone qualified.

### Who is responsible

AgoraX is a student pilot run by Nikita Sondarev ("Mike"). Questions and requests: sondarevn@gmail.com.

[To be confirmed: the legal name of the data controller (a person or an organisation), a postal address, and whether anyone else decides with us how data is used.]

### What we keep

You never need to give your name, email or number to browse or to say you are interested.

| | |
| --- | --- |
| Without asking you anything | A random ID for this browser (there are no accounts), when you first and last visited, and which poster or shared link brought you here. |
| When you use the pilot | The proposals you are interested in, saved and answered price questions for; your timing preference; whether you attend, organise or both; offers to help run something; ideas you propose (and any picture you add); suggestions; space offers. |
| Only if you fill it in | Your email and/or WhatsApp number and first name, and which messages you agreed to, with the date and the wording version. |
| Only if you choose to show it | The first letter of your name on a proposal you are interested in (visible to every visitor), and a public profile (display name, optional picture, cover, bio, interests, area and organiser description). Public profiles open once this notice is final. |
| Visit statistics (you can switch these off) | Which cards you saw and opened, how far you scrolled, and which "coming soon" features you tapped. No name or contact details. |

### Why, and on what basis

[To be confirmed: the legal bases below are our proposal and need review.]

| | |
| --- | --- |
| Running the pilot and counting interest | Legitimate interest: finding out which events students would really go to (proposed basis). |
| Telling you whether your events go ahead, are cancelled or won't happen | Your consent, given with the tick box. You can withdraw it any time. |
| Talking to you about an event you offered to run, proposed or a space you offered | Your consent, for that purpose only. |
| Telling you once if AgoraX launches (optional, email only) | Your consent. Off unless you tick it. Not offered until this notice is final. |
| Occasional invitations to other events (optional, email only) | Your consent. Off unless you tick it. Not offered until this notice is final. |
| Visit statistics | Legitimate interest, with a switch to turn it off. [To be confirmed: whether Dutch law requires opt-in consent for this, because it uses browser storage.] |
| Keeping the site secure and working | Legitimate interest. |

### Who else handles it

We never sell your data or use your number for marketing. These services handle data for the pilot:

| | |
| --- | --- |
| Google Firebase (Google) | Stores everything above and runs the anonymous sign-in. [To be confirmed: the Firestore data location, the Google entity and data processing terms, and the safeguards for transfers outside the EU.] |
| Vercel | Hosts the website; it receives your IP address and browser details when the page loads. [To be confirmed: Vercel's data processing terms, server location and log retention.] |
| Unsplash | Serves the event photos, so it sees your IP address when a photo loads. |
| Wikimedia Commons and Openverse | Only if you look for a photo while proposing an event: they receive what you searched for and your IP address. |
| WhatsApp (Meta) or email | When we contact you by hand, the message goes through the app you chose. [To be confirmed: which email service we send from.] |

### Cookies and browser storage

AgoraX sets no cookies of its own. It keeps a few small items in your browser: the anonymous sign-in (Firebase), which poster or link brought you here, your city choice, whether the menu is open, whether you dismissed the contact banner, whether statistics are off, and which cards were already counted. [To be confirmed: that Vercel sets no cookies.]

### How long we keep it

[To be confirmed: retention periods. Nothing is deleted automatically yet. A decision is needed on how long contact details, interests and statistics are kept, for example a fixed number of months after your last visit or after the pilot ends, and how that deletion will be carried out.]

Until then, you can delete your contact details or everything at any time yourself (below).

### Your rights

You can ask to see, correct, export or delete your data, object to how we use it, or ask us to limit it. You can withdraw any consent at any time; it does not affect what was done before.

Do it yourself: Privacy & my data → Delete my contact details; Notification preferences → switch messages off; Account & security → Delete my data and account (withdraws your interests, then deletes your profile, contact details, settings and this account).

Or email sondarevn@gmail.com. We answer within one month. Proposals you already sent and anonymous records without contact details are only removed on request.

If you are unhappy with how we handle your data, you can complain to the Dutch data protection authority, the Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).

### Other things to know

The pilot is meant for students aged 16 and over. [To be confirmed: the minimum age.] We make no automated decisions about you.

This is notice version draft-2026-10. When it changes, we will say so in the app.
<!-- notice:end -->
