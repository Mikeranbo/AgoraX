/** Sidebar items that are not built yet. Taps and "I want this" votes rank them on /admin. */
export const LOCKED_FEATURES = {
  helping: "Events I'm helping run",
  saved: 'Saved events',
  tickets: 'Tickets & payments',
  earnings: 'Earnings & payouts',
  friends: 'Friends',
  messages: 'Messages',
  communities: 'Communities',
  map: 'Map of events nearby',
  calendar: 'Calendar sync',
  cities: 'Other cities',
  'host-dashboard': 'Host dashboard',
  notifications: 'Notifications',
  dutch: 'Nederlands',
  appearance: 'Appearance',
  devices: 'Keep my account on other devices',
  terms: 'Terms',
} as const;

export type LockedFeature = keyof typeof LOCKED_FEATURES;

export function featureLabel(id: string): string {
  return (LOCKED_FEATURES as Record<string, string>)[id] ?? id;
}
