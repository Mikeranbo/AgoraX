/**
 * A/B test: one link, two pages. Each visit shows page A (`simple`, the mentor's version) or page B
 * (`current`, Mike's cleaned version). The choice is made once, when this module loads:
 *
 *  1. `?v=simple` or `?v=current` forces a page for looking at it. Such visits are marked as tests
 *     (`simple-test` / `current-test`) and never count in the A/B numbers.
 *  2. A browser that saved a variant at its first action (agorax_variant, written together with the
 *     ID) always gets that page again.
 *  3. Otherwise a 50/50 coin flip, kept in memory only: nothing is stored before the first action.
 *     A visitor who never taps anything may get the other page next time.
 *
 * VITE_AB_VARIANT (browser tests only) replaces the coin flip so a test knows which page it gets.
 */
export type Variant = 'simple' | 'current';
/** What is saved with the ID and on every record: the page, plus "-test" for ?v= visits. */
export type VariantStamp = Variant | 'simple-test' | 'current-test';

export const VARIANT_STAMPS: VariantStamp[] = ['simple', 'current', 'simple-test', 'current-test'];
/** localStorage key, written only at the first action, next to agorax_id. */
export const VARIANT_KEY = 'agorax_variant';

interface ConceptFlags {
  /** Page A: explainer on top, every event as one list, plain answers on every card, the short flows. */
  simple: boolean;
  /** Sidebar, the More menu, My account, profiles and the organiser account types. */
  menuAndAccount: boolean;
  /** Locked "coming soon" items and the feature votes. */
  comingSoon: boolean;
  /** City, "Use my location", All / Near / Other, Today / Tomorrow, "How near works". */
  placeAndDateFilters: boolean;
  /** The Proposals / Scheduled switch. */
  scheduledTab: boolean;
  /** The graffiti doodles behind the page. Off: plain navy. */
  doodles: boolean;
  /** Videos in galleries. Off: photos only. */
  videos: boolean;
  /** The opening screen with the cut-out figures (off on both pages; it stays on the tag cutout-hero-original). */
  openingHero: boolean;
  /**
   * The pilot notice dialog on arrival ("Events are not confirmed. Prices and potential earnings are
   * hypothetical…"). On both pages since 24 Nov 2026, so the A/B test compares only the design.
   */
  pilotNoticeOnEntry: boolean;
}

export const PAGES: Record<Variant, ConceptFlags> = {
  // Page A, as on branch concept-simple.
  simple: {
    simple: true,
    menuAndAccount: false,
    comingSoon: false,
    placeAndDateFilters: false,
    scheduledTab: false,
    doodles: false,
    videos: false,
    openingHero: false,
    pilotNoticeOnEntry: true,
  },
  // Page B, as on branch concept-current.
  current: {
    simple: false,
    menuAndAccount: true,
    comingSoon: true,
    placeAndDateFilters: false,
    scheduledTab: true,
    doodles: true,
    videos: false,
    openingHero: false,
    pilotNoticeOnEntry: true,
  },
};

export const isVariantStamp = (v: unknown): v is VariantStamp => VARIANT_STAMPS.includes(v as VariantStamp);
export const pageOf = (stamp: VariantStamp): Variant => (stamp.startsWith('simple') ? 'simple' : 'current');

/** The rule above, as a pure function (unit-tested). */
export function chooseVariant(input: { query: string; saved: string | null; forcedByBuild?: string; random: () => number }): {
  page: Variant;
  stamp: VariantStamp;
  counts: boolean;
} {
  const v = new URLSearchParams(input.query).get('v');
  if (v === 'simple' || v === 'current') return { page: v, stamp: `${v}-test`, counts: false };
  if (isVariantStamp(input.saved)) return { page: pageOf(input.saved), stamp: input.saved, counts: !input.saved.endsWith('-test') };
  const page: Variant =
    input.forcedByBuild === 'simple' || input.forcedByBuild === 'current' ? input.forcedByBuild : input.random() < 0.5 ? 'simple' : 'current';
  return { page, stamp: page, counts: true };
}

function readQuery(): string {
  try {
    return window.location.search;
  } catch {
    return '';
  }
}

function readSaved(): string | null {
  try {
    return localStorage.getItem(VARIANT_KEY);
  } catch {
    return null;
  }
}

const assignment = chooseVariant({
  query: readQuery(),
  saved: readSaved(),
  forcedByBuild: import.meta.env.VITE_AB_VARIANT,
  random: Math.random,
});

/** The page this visit shows. */
export const VARIANT: Variant = assignment.page;
/** Saved with the ID and put on every join, contact, helper offer, message and analytics event. */
export const VARIANT_STAMP: VariantStamp = assignment.stamp;
/** False for ?v= visits and saved test variants: their page loads are not counted. */
export const COUNTS_IN_AB_TEST: boolean = assignment.counts;
/** The switches for this visit's page. */
export const CONCEPT: ConceptFlags = PAGES[VARIANT];
