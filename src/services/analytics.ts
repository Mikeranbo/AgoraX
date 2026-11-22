import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ensureAnonymousAuth, getSource } from './identity';
import { VARIANT_STAMP } from '../config/concept';

export type AnalyticsName =
  | 'page_view'
  | 'card_impression'
  | 'card_open'
  | 'join_click'
  | 'leave_click'
  | 'organiser_panel_open'
  | 'organiser_interest_click'
  | 'venue_offer_submit'
  | 'contact_submit'
  | 'suggestion_submit'
  | 'price_ladder_answer'
  | 'proposal_submit'
  | 'share_click'
  | 'scroll_depth_25'
  | 'scroll_depth_50'
  | 'scroll_depth_75'
  | 'scroll_depth_100'
  | 'invite_click'
  | 'locked_feature_click'
  | 'feature_vote';

/** The answer to the statistics banner, kept per device: 'yes', 'no', or not asked yet. */
const CONSENT_KEY = 'agorax_stats_consent';
/** The old "statistics off" switch; still honoured as a "no". */
const LEGACY_OFF_KEY = 'agorax_no_stats';

export type StatsChoice = 'yes' | 'no' | null;

/** Used when the browser keeps no storage (private mode): the answer lasts for this visit. */
let memoryChoice: StatsChoice = null;

export function statsChoice(): StatsChoice {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === 'yes' || v === 'no') return v;
    if (localStorage.getItem(LEGACY_OFF_KEY) === '1') return 'no';
  } catch {
    /* no storage: fall back to this visit's answer */
  }
  return memoryChoice;
}

/**
 * Visit statistics are counted only after a "yes" (opt-in). Until someone answers, nothing is
 * tracked. Joins, saves and contact details are not statistics and work either way.
 */
export function statsOff(): boolean {
  return statsChoice() !== 'yes';
}

export function setStatsOff(off: boolean) {
  memoryChoice = off ? 'no' : 'yes';
  try {
    localStorage.setItem(CONSENT_KEY, memoryChoice);
    localStorage.removeItem(LEGACY_OFF_KEY);
  } catch {
    /* private mode: the answer lasts for this visit only */
  }
}

/** Fire-and-forget: analytics must never block or break the UI. */
export function track(name: AnalyticsName, payload: Record<string, unknown> = {}): void {
  if (statsOff()) return;
  void (async () => {
    try {
      const user = await ensureAnonymousAuth();
      await addDoc(collection(db, 'analytics'), {
        uid: user.uid,
        name,
        payload,
        source: getSource(),
        ts: serverTimestamp(),
        variant: VARIANT_STAMP,
      });
    } catch (err) {
      console.warn('analytics failed', name, err);
    }
  })();
}
