/**
 * Branch concept-simple (the mentor's version): a student who scans the QR code understands the
 * page in five seconds, picks events and leaves a contact. Everything else is switched off here,
 * not deleted, so any part can come back by flipping one flag.
 */
export const CONCEPT = {
  /** Explainer on top, the shortlist of events, plain answers on every card, the short flows. */
  simple: true,
  /** Sidebar, the More menu, My account, profiles and the organiser account types. */
  menuAndAccount: false,
  /** Locked "coming soon" items and the feature votes. */
  comingSoon: false,
  /** City, near / other locations and the Today / Tomorrow chips. */
  placeAndDateFilters: false,
  /** The Proposals / Scheduled switch (nothing has a date in the pilot). */
  scheduledTab: false,
  /** The graffiti doodles behind the page. Off: plain navy. */
  doodles: false,
  /** Videos in galleries. Off: photos only. */
  videos: false,
  /** The opening screen with the cut-out figures. */
  openingHero: false,
  /** The pilot notice dialog on the first visit. Off: the explainer on top of the page says it. */
  pilotNoticeOnEntry: false,
} as const;
