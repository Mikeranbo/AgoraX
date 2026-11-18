import { CONTACT_EMAIL, PILOT_CITY } from '../config/pilot';
import type { NoticeSection } from './privacyNotice';

/**
 * Terms of Use and Cookie Policy, rendered by LegalDocScreen. Like the privacy policy they
 * describe what the code actually does. Facts we cannot confirm from the code stay marked
 * [To be confirmed: …], and both need review by someone qualified before they are final.
 */
export const LEGAL_DOCS_VERSION = 'draft-2026-11';

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
        `AgoraX is a student pilot run from ${PILOT_CITY} by Nikita Sondarev ("Mike"). Contact: ${CONTACT_EMAIL}.`,
        '[To be confirmed: the legal name of the operator, a postal address and, once registered, the KvK number.]',
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
        'There is no sign-up or password. The site gives this browser a random ID, and your interests and settings are linked to it. If you clear your browser data or switch device, we cannot bring them back.',
        'You can delete everything at any time under My account → Account & security.',
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
    "AgoraX sets no cookies of its own and uses no advertising or third-party tracking tools. It keeps a few small items in your browser's storage. Under Dutch law (Telecommunicatiewet, article 11.7a) only the items the site needs to work may be kept without asking; for statistics we ask first.",
  sections: [
    {
      title: 'Needed for the site to work (no consent needed)',
      paragraphs: ['These stay on your device and are only used to make the site work for you:'],
      table: [
        ['Anonymous sign-in', "Firebase keeps a random ID for this browser (IndexedDB), so your interests stay yours. There's no name or password in it."],
        ['Your choices', 'Your answer to the statistics question, your city, whether the menu is open, whether you saw the pilot note or closed the contact banner (localStorage).'],
        ['Where you came from', 'Which poster or shared link brought you here, so we can count interest per poster (localStorage).'],
        ['This visit', 'That the opening screen was already shown in this tab (sessionStorage, gone when you close the tab).'],
      ],
    },
    {
      title: 'Statistics (only if you allow them)',
      paragraphs: [
        'If you tap "Allow" on the statistics question, we count which events you see and open, how far you scroll and which "coming soon" items you tap. This is stored in our Firebase database with your random ID, without your name or contact details. Your browser also remembers which cards were already counted, so they are not counted twice.',
        'If you tap "No thanks", or don\'t answer, nothing is counted. You can change your answer any time in My account → Privacy & my data.',
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
        ['Vercel', 'Hosts the site. [To be confirmed: that Vercel sets no cookies.]'],
      ],
    },
    {
      title: 'Clearing it',
      paragraphs: [
        'You can delete all of it through your browser settings (site data for this website). You then start again as a new visitor, and your interests are no longer linked to you. To delete what we store on our side as well, use My account → Account & security → Delete my data and account.',
        `Questions: ${CONTACT_EMAIL}. Version ${LEGAL_DOCS_VERSION}.`,
      ],
    },
  ],
};
