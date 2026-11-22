import { CONTACT_EMAIL, PILOT_CITY } from '../config/pilot';
import { LEGAL } from '../config/legal';

/**
 * Terms of Use and Cookie Policy, rendered by LegalDocScreen. Like the privacy notice
 * (src/data/privacyNotice.ts, version 1.2) they describe what the code actually does. The
 * Cookie Policy lists every item section 5 of the notice mentions; keep the two in step.
 */
export const LEGAL_DOCS_VERSION = '1.2-2026-11-22';

export interface NoticeSection {
  title: string;
  paragraphs: string[];
  /** Optional rows: [what, detail]. */
  table?: [string, string][];
}

export interface LegalDoc {
  title: string;
  intro: string;
  sections: NoticeSection[];
}

export const TERMS: LegalDoc = {
  title: 'Terms of Use',
  intro:
    'These terms apply when you use the AgoraX website during the pilot. They are written in plain English. Dutch law applies to them, and nothing here takes away the rights Dutch and EU law give you as a consumer.',
  sections: [
    {
      title: '1. Who we are',
      paragraphs: [
        `AgoraX is a student pilot run from ${PILOT_CITY} by ${LEGAL.legalName}, a private person and a student at Hanze University of Applied Sciences. Hanze University is not involved in running the pilot.`,
        `Address: ${LEGAL.postalAddress}. Email: ${CONTACT_EMAIL}. AgoraX is not a registered company yet, so there is no KvK number.`,
      ],
    },
    {
      title: '2. What AgoraX is, and what it is not',
      paragraphs: [
        'AgoraX is a pilot. We want to find out which events students would really go to. The events on the site are proposals: ideas without a date.',
        'Saying you are interested is not a booking and not a promise to attend. Nothing is paid through AgoraX, and prices shown are rough estimates. An event only runs if enough people are interested and someone can organise it, so it may never happen.',
      ],
    },
    {
      title: '3. Who can use it',
      paragraphs: [
        'You need to be 16 or older to give us an email address or phone number, to propose an event or to apply as an organiser. Anyone can browse.',
      ],
    },
    {
      title: '4. Your anonymous account',
      paragraphs: [
        'There is no sign-up or password. Just looking around creates nothing. The first time you do something, for example tap "Interested", the site gives this browser a random ID, and your interests and settings are linked to it. If you clear your browser data or switch device, we cannot bring them back.',
        'You can delete your contact details or everything at any time under Privacy & my data, linked at the bottom of every page.',
      ],
    },
    {
      title: '5. What you add to AgoraX',
      paragraphs: [
        'Proposals, photos, videos, profile text and organiser applications stay yours. You allow AgoraX to show them on the site, free of charge and for as long as the pilot runs, and to shorten, crop or remove them.',
        "Only add what you have the right to use, and credit photos and videos that aren't yours. Don't add anything unlawful, hateful, discriminatory, sexual, violent or misleading, no advertising or spam, and no personal details of other people without their permission.",
      ],
    },
    {
      title: '6. Organisers',
      paragraphs: [
        'Anyone can apply to become an organiser. An AgoraX admin decides, and can take the approval back at any time, for example after complaints. Approved organisers get a badge and can put their own events live without review.',
        'Organisers are responsible for their own events: that they are legal and safe, that costs are described honestly, and that the rules of the venue and Dutch law are followed (for example on alcohol, permits and capacity). AgoraX does not take part in any agreement between an organiser and the people who join, and no money goes through AgoraX.',
      ],
    },
    {
      title: '7. Using the site fairly',
      paragraphs: [
        "Don't try to break or overload the site, read data you weren't meant to see, inflate interest counts, sign up automatically, or pretend to be someone else. We may remove content or block use that breaks these terms or the law.",
      ],
    },
    {
      title: '8. Liability',
      paragraphs: [
        'AgoraX is a free pilot and is offered as it is. It can contain mistakes, change or stop at any time. We are not liable for events run by organisers, or for indirect damage.',
        'This does not limit liability that Dutch law does not allow us to limit, such as damage caused on purpose or through gross negligence, and it does not affect your rights as a consumer.',
      ],
    },
    {
      title: '9. Privacy',
      paragraphs: ['How we handle personal data is in the Privacy Policy, and what the site keeps in your browser is in the Cookie Policy.'],
    },
    {
      title: '10. Changes',
      paragraphs: [`We may change these terms while the pilot develops. The version below changes with them, and we say so in the app when something important changes. This is version ${LEGAL_DOCS_VERSION}.`],
    },
    {
      title: '11. Law and disputes',
      paragraphs: [
        `Dutch law applies. Please tell us first if something is wrong (${CONTACT_EMAIL}); we try to solve it together. If that doesn't work, the competent court in the Netherlands decides, which for us is the Rechtbank Noord-Nederland, unless the law lets you as a consumer choose another court.`,
      ],
    },
  ],
};

export const COOKIES: LegalDoc = {
  title: 'Cookie Policy',
  intro:
    "AgoraX sets no cookies of its own, and the site's hosting (Vercel) sets none either. It uses no advertising or third-party tracking tools. Just visiting stores nothing on your device and creates no ID. Under Dutch law (Telecommunicatiewet, article 11.7a) only what the site needs to do what you asked may be kept in your browser without asking, so each item below is saved only after you do the thing it belongs to. For statistics we ask first.",
  sections: [
    {
      title: 'Before you do anything',
      paragraphs: [
        'Opening the site adds one to an anonymous visit count for the poster or shared link that brought you here, and for the version of the page you were shown. That count is kept in our database, not on your device, and no ID is involved.',
      ],
    },
    {
      title: 'Needed for what you asked (no consent needed)',
      paragraphs: ["These are kept in your browser's storage, only from the moment you do the thing they belong to:"],
      table: [
        ['Anonymous sign-in', 'From your first action, for example tapping "Interested". Firebase keeps a random ID for this browser (IndexedDB), and the site notes that this browser has one (localStorage, agorax_id), so your interests stay yours. There is no name or password in it.'],
        ['Where you came from', 'Which poster or shared link brought you here, saved when the ID is created, so interest can be counted per poster (localStorage, agorax_src).'],
        ['Your settings', 'Your city and whether the menu is open, once you change them (localStorage, agorax_city and agorax_sidebar).'],
        ['Notices you closed', 'That you closed the pilot notice or the contact banner (localStorage, agorax.pilotNotice.hidden and agorax_banner_dismissed), and that this tab already showed the opening screen (sessionStorage, agorax.entry.done, gone when you close the tab).'],
        ['Your statistics answer', 'Your yes or no to the statistics question, once you tap one (localStorage, agorax_stats_consent).'],
        ['Which version of the page you got', 'We are comparing two versions of this page. From your first action, the browser remembers which one you got, so it stays the same (localStorage, agorax_variant).'],
      ],
    },
    {
      title: 'Statistics (only if you allow them)',
      paragraphs: [
        'If you tap "Allow" on the statistics question, we count which events you see and open, how far you scroll and which "coming soon" items you tap. This is stored in our Firebase database with your random ID, without your name or contact details. Your browser also remembers which cards were already counted, so they are not counted twice (localStorage, agorax_counted).',
        'If you tap "No thanks", or don\'t answer, nothing is counted. You can change your answer any time under Privacy & my data, linked at the bottom of every page.',
      ],
    },
    {
      title: 'Content from other services',
      paragraphs: ['Some content loads from other services, which then see your IP address and may set their own cookies:'],
      table: [
        ['Unsplash', 'Some event photos.'],
        ['YouTube', 'Only when you press play on a video, through its privacy-enhanced mode (youtube-nocookie.com).'],
        ['Vimeo', 'Only when you press play, with "do not track" switched on.'],
        ['Wikimedia Commons and Openverse', 'Only while you look for a photo when proposing an event.'],
        ['Vercel', 'Hosts the site. It sets no cookies; it receives your IP address and browser details when the page loads.'],
      ],
    },
    {
      title: 'Clearing it',
      paragraphs: [
        'You can delete all of it through your browser settings (site data for this website). You then start again as a new visitor, and your interests are no longer linked to you. To delete what we store on our side as well, use Privacy & my data → Delete everything.',
        `Questions: ${CONTACT_EMAIL}. Version ${LEGAL_DOCS_VERSION}.`,
      ],
    },
  ],
};
