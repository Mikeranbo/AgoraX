/**
 * Branch concept-current (Mike's version, cleaned): main without the opening hero, without the
 * location and date filter box, and with photos only. The parts are switched off here, not
 * deleted, so any of them can come back by flipping one flag.
 */
export const CONCEPT = {
  /** The opening screen with the cut-out figures. Off: a slim top bar with the logo. */
  openingHero: false,
  /** City, "Use my location", All / Near / Other locations, Today / Tomorrow and "How near works". */
  placeAndDateFilters: false,
  /** Videos in galleries. Off: photos only. */
  videos: false,
} as const;
