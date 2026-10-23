import { CONTACT_EMAIL, NOTICE_VERSION } from '../config/pilot';

/**
 * The privacy notice, as it is rendered in the app (PrivacyNoticeScreen) and reviewed in
 * docs/PRIVACY_NOTICE_DRAFT.md. It describes what the code actually does. Anything we could
 * not confirm from the code is written as [To be confirmed: …] and must be filled in, and the
 * whole notice reviewed, before VITE_PRIVACY_NOTICE_FINAL is set to true.
 */
export const NOTICE_STATUS = {
  version: NOTICE_VERSION,
  draft: true,
  note: 'Draft for review. Some facts below are still to be confirmed, and the legal bases need checking by someone qualified.',
};

export interface NoticeSection {
  title: string;
  paragraphs: string[];
  /** Optional rows: [what, detail]. */
  table?: [string, string][];
}

export const NOTICE_SECTIONS: NoticeSection[] = [
  {
    title: 'Who is responsible',
    paragraphs: [
      `AgoraX is a student pilot run by Nikita Sondarev ("Mike"). Questions and requests: ${CONTACT_EMAIL}.`,
      '[To be confirmed: the legal name of the data controller (a person or an organisation), a postal address, and whether anyone else decides with us how data is used.]',
    ],
  },
  {
    title: 'What we keep',
    paragraphs: ['You never need to give your name, email or number to browse or to say you are interested.'],
    table: [
      ['Without asking you anything', 'A random ID for this browser (there are no accounts), when you first and last visited, and which poster or shared link brought you here.'],
      ['When you use the pilot', 'The proposals you are interested in, saved and answered price questions for; your timing preference; whether you attend, organise or both; offers to help run something; ideas you propose (and any picture you add); suggestions; space offers.'],
      ['Only if you fill it in', 'Your email and/or WhatsApp number and first name, and which messages you agreed to, with the date and the wording version.'],
      ['Only if you choose to show it', 'The first letter of your name on a proposal you are interested in (visible to every visitor), and a public profile (display name, optional picture, cover, bio, interests, area and organiser description). Public profiles open once this notice is final.'],
      ['Visit statistics (you can switch these off)', 'Which cards you saw and opened, how far you scrolled, and which "coming soon" features you tapped. No name or contact details.'],
    ],
  },
  {
    title: 'Why, and on what basis',
    paragraphs: ['[To be confirmed: the legal bases below are our proposal and need review.]'],
    table: [
      ['Running the pilot and counting interest', 'Legitimate interest: finding out which events students would really go to (proposed basis).'],
      ['Telling you whether your events go ahead, are cancelled or won\'t happen', 'Your consent, given with the tick box. You can withdraw it any time.'],
      ['Talking to you about an event you offered to run, proposed or a space you offered', 'Your consent, for that purpose only.'],
      ['Telling you once if AgoraX launches (optional, email only)', 'Your consent. Off unless you tick it. Not offered until this notice is final.'],
      ['Occasional invitations to other events (optional, email only)', 'Your consent. Off unless you tick it. Not offered until this notice is final.'],
      ['Visit statistics', 'Legitimate interest, with a switch to turn it off. [To be confirmed: whether Dutch law requires opt-in consent for this, because it uses browser storage.]'],
      ['Keeping the site secure and working', 'Legitimate interest.'],
    ],
  },
  {
    title: 'Who else handles it',
    paragraphs: [
      'We never sell your data or use your number for marketing. These services handle data for the pilot:',
    ],
    table: [
      ['Google Firebase (Google)', 'Stores everything above and runs the anonymous sign-in. [To be confirmed: the Firestore data location, the Google entity and data processing terms, and the safeguards for transfers outside the EU.]'],
      ['Vercel', 'Hosts the website; it receives your IP address and browser details when the page loads. [To be confirmed: Vercel\'s data processing terms, server location and log retention.]'],
      ['Unsplash', 'Serves the event photos, so it sees your IP address when a photo loads.'],
      ['Wikimedia Commons and Openverse', 'Only if you look for a photo while proposing an event: they receive what you searched for and your IP address.'],
      ['WhatsApp (Meta) or email', 'When we contact you by hand, the message goes through the app you chose. [To be confirmed: which email service we send from.]'],
    ],
  },
  {
    title: 'Cookies and browser storage',
    paragraphs: [
      'AgoraX sets no cookies of its own. It keeps a few small items in your browser: the anonymous sign-in (Firebase), which poster or link brought you here, your city choice, whether the menu is open, whether you dismissed the contact banner, whether statistics are off, and which cards were already counted. [To be confirmed: that Vercel sets no cookies.]',
    ],
  },
  {
    title: 'How long we keep it',
    paragraphs: [
      '[To be confirmed: retention periods. Nothing is deleted automatically yet. A decision is needed on how long contact details, interests and statistics are kept, for example a fixed number of months after your last visit or after the pilot ends, and how that deletion will be carried out.]',
      'Until then, you can delete your contact details or everything at any time yourself (below).',
    ],
  },
  {
    title: 'Your rights',
    paragraphs: [
      'You can ask to see, correct, export or delete your data, object to how we use it, or ask us to limit it. You can withdraw any consent at any time; it does not affect what was done before.',
      'Do it yourself: Privacy & my data → Delete my contact details; Notification preferences → switch messages off; Account & security → Delete my data and account (withdraws your interests, then deletes your profile, contact details, settings and this account).',
      `Or email ${CONTACT_EMAIL}. We answer within one month. Proposals you already sent and anonymous records without contact details are only removed on request.`,
      'If you are unhappy with how we handle your data, you can complain to the Dutch data protection authority, the Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).',
    ],
  },
  {
    title: 'Other things to know',
    paragraphs: [
      'The pilot is meant for students aged 16 and over. [To be confirmed: the minimum age.] We make no automated decisions about you.',
      `This is notice version ${NOTICE_VERSION}. When it changes, we will say so in the app.`,
    ],
  },
];
