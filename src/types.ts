export type EventCategory =
  | 'Sports'
  | 'Games'
  | 'Creative'
  | 'Social'
  | 'Study'
  | 'Tech & Ideas'
  | 'Outdoor'
  // Legacy categories — kept so older documents keep rendering.
  | 'Workshop'
  | 'Concert'
  | 'Cultural'
  | 'Fitness'
  | 'Startup';

/** Categories shown as filter chips and offered when creating events. */
export const PUBLIC_CATEGORIES: EventCategory[] = [
  'Sports',
  'Games',
  'Creative',
  'Social',
  'Study',
  'Tech & Ideas',
  'Outdoor',
];

export const LEGACY_CATEGORIES: EventCategory[] = ['Workshop', 'Concert', 'Cultural', 'Fitness', 'Startup'];

export type EventStatus = 'Pending' | 'Confirmed' | 'Cancelled';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  price: number;
  minParticipants: number;
  participantsCount: number;
  deadline: string; // ISO date string
  startTime: string; // ISO date string
  status: EventStatus;
  organizerId: string;
  venueId?: string;
  imageUrls: string[];
  mapsLink?: string;
  /** Aggregate counters, bumped with increment() so the admin page never scans analytics. */
  impressions?: number;
  opens?: number;
  joins?: number;
  organiserInterest?: number;
  clicks?: number;
  /** Firestore Timestamp (or null while the write is still pending). Absent on older documents. */
  createdAt?: any;
  /** 'seed' = one of the 33; 'proposal' = created by approving a student proposal. */
  origin?: 'seed' | 'proposal';
  /** proposals/{id} this event was approved from. */
  proposalId?: string;
  // Fields that come from the seed list / admin editor.
  slug?: string;
  durationHours?: number;
  hostsNeeded?: number;
  fixedCost?: number;
  perPersonCost?: number;
  bringYourOwn?: string;
  venueNote?: string;
  season?: 'any' | 'spring';
  emoji?: string;
  accent?: string;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  location: string;
  hourlyRate: number;
  capacity: number;
  imageUrls: string[];
  ownerId: string;
}

export interface Comment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export type PriceAnswer = 'yes' | 'no' | 'depends';

export type RanBefore = 'yes' | 'no' | 'sort-of';

export type SpaceType = 'room' | 'hall' | 'cafe' | 'other';

/** venueOffers/{id}. The person's name and contact live on users/{uid} (consent 'space'). */
export interface VenueOffer {
  id: string;
  uid: string;
  spaceType: SpaceType;
  capacity: number;
  source?: string;
  ts?: any;
}

/** proposals/{id}. Hidden from the feed; an admin approves it into a real event. No contact fields. */
export interface Proposal {
  id: string;
  uid: string;
  title: string;
  category: EventCategory;
  price: number;
  minPeople: number;
  needs: string;
  status: 'new' | 'approved' | 'rejected';
  eventId?: string;
  source: string;
  ts?: any;
}

/** events/{eventId}/helpers/{uid}. Contact details are not copied here — they live on users/{uid}. */
export interface HelperDoc {
  uid: string;
  eventId: string;
  ranBefore: RanBefore;
  ts?: any;
}

/** Shape of users/{uid}. Everything beyond uid/createdAt/lastSeenAt/source is optional. */
export interface UserDoc {
  uid: string;
  createdAt?: any;
  lastSeenAt?: any;
  source?: string;
  /** Code carried by this visitor's share links (first 8 chars of the uid). */
  shareCode?: string;
  /** Share code of whoever's link brought this visitor here, if any. */
  referredBy?: string | null;
  hasContact?: boolean;
  name?: string;
  email?: string;
  phone?: string;
  wantsToOrganise?: boolean;
  hasSpace?: boolean;
  consent?: boolean;
  consentAt?: any;
  /** Event ids the person has joined — mirrors events/{id}/participants/{uid}. */
  joinedEvents?: string[];
  /** Event ids the person tapped "help run this" on. */
  organiserEvents?: string[];
  priceAnswers?: Record<string, { answer: PriceAnswer; priceAsked: number; priceSeen: number; ts: any }>;
}

export interface ParticipantDoc {
  eventId: string;
  uid: string;
  joinedAt?: any;
  priceSeen?: number;
  source?: string;
}

export type AdminRole = 'owner' | 'editor' | 'viewer';

export interface AdminDoc {
  uid: string;
  role: AdminRole;
  label?: string;
  grantedBy?: string;
  grantedAt?: any;
}
