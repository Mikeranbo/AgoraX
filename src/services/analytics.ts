import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ensureAnonymousAuth, getSource } from './identity';

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

const STATS_OFF_KEY = 'agorax_no_stats';

/** "Count my visits in AgoraX statistics" switch, kept per device. Joins are never affected. */
export function statsOff(): boolean {
  try {
    return localStorage.getItem(STATS_OFF_KEY) === '1';
  } catch {
    return false;
  }
}

export function setStatsOff(off: boolean) {
  try {
    if (off) localStorage.setItem(STATS_OFF_KEY, '1');
    else localStorage.removeItem(STATS_OFF_KEY);
  } catch {
    /* private mode: the switch lasts for this visit only */
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
      });
    } catch (err) {
      console.warn('analytics failed', name, err);
    }
  })();
}
