/**
 * One consent per purpose (GDPR: never bundle purposes). The wording version and the privacy
 * notice version are stored with each consent, so we can show later exactly which sentence a
 * person agreed to and under which notice.
 */
export type ConsentPurpose = 'updates' | 'organising' | 'proposal' | 'space' | 'launch' | 'invites';

/** v2: "updates" now covers whether an event goes ahead, is cancelled or won't happen. */
export const CONSENT_VERSION = 'v2';

export const CONSENT_TEXTS: Record<ConsentPurpose, string> = {
  updates:
    "Tell me whether an event I'm interested in goes ahead, is cancelled or won't happen. Only that, and I can turn it off any time.",
  organising:
    "We'll only use this to talk to you about running this event. Nothing else, and you can ask us to delete it any time.",
  proposal:
    "We'll only use this to talk to you about the event you proposed. Nothing else, and you can ask us to delete it any time.",
  space:
    "We'll only use this to talk to you about using your space for an event. Nothing else, and you can ask us to delete it any time.",
  launch: 'Optional: email me once if AgoraX launches properly. I can turn this off any time.',
  invites: 'Optional: email me now and then about other events I might like. I can turn this off any time.',
};

/** Purposes that are marketing-like: email only, never WhatsApp or SMS, always opt-in. */
export const EMAIL_ONLY_PURPOSES: ConsentPurpose[] = ['launch', 'invites'];
