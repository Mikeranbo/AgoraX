import type { ConsentPurpose } from './data/consent';
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
  /**
   * ISO date strings. Older documents carry placeholder values written at seeding; they are kept
   * but only shown when an admin confirms the date (see dateConfirmed and data/schedule.ts).
   */
  deadline?: string;
  startTime?: string;
  /** Set by an admin when startTime is a real, agreed date. */
  dateConfirmed?: boolean;
  /** Where it is organised; proposals without one count as the pilot city. */
  city?: string;
  /** Public profile id of the organiser who proposed it (never their uid). */
  organiserPublicId?: string;
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
  /** "Photo: Jane Doe, CC BY" for pictures whose licence asks for credit. */
  imageCredit?: string;
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
  /** https link or a compressed data:image URL (see data/images.ts). */
  image?: string;
  imageCredit?: string;
  /** 'draft' is still being edited by its author; 'new' is sent for review. */
  status: 'draft' | 'new' | 'approved' | 'rejected';
  eventId?: string;
  /** The author's public profile id, when they propose as an organiser. */
  organiserPublicId?: string;
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
  /** Private name shown only to this visitor, in the sidebar and profile. */
  displayName?: string;
  name?: string;
  email?: string;
  phone?: string;
  wantsToOrganise?: boolean;
  hasSpace?: boolean;
  consent?: boolean;
  consentAt?: any;
  /** One entry per purpose the person agreed to (see data/consent.ts). */
  consents?: Partial<Record<ConsentPurpose, { version: string; notice?: string; at: any }>>;
  /** Event ids the person has joined — mirrors events/{id}/participants/{uid}. */
  joinedEvents?: string[];
  /** Event ids the person tapped "help run this" on. */
  organiserEvents?: string[];
  priceAnswers?: Record<string, { answer: PriceAnswer; priceAsked: number; priceSeen: number; ts: any }>;
  /** Event id of the latest price answer; the rules use it to check that single entry. */
  lastPriceAnswer?: string;
  /** Attend / Organise / Both, chosen by the person. Organising never grants admin rights. */
  mode?: UserMode;
  /** Event ids saved for later. Private. */
  savedEvents?: string[];
  /** When events would suit them. A preference, not a booking. Private. */
  preferredTiming?: PreferredTiming;
  /** Their public profile id (profiles/{publicId}). Kept private so the two can't be linked. */
  publicId?: string;
}

export type UserMode = 'attend' | 'organise' | 'both';

export type PreferredTiming = 'weekday-evening' | 'weekend' | 'flexible';

/** profiles/{publicId}: what a person chose to show. No uid, contact details or history. */
export interface PublicProfile {
  displayName: string;
  bio?: string;
  interests?: string;
  /** Broad area only, e.g. "Groningen". */
  area?: string;
  /** Compressed JPEG/WebP data URLs. */
  avatar?: string;
  cover?: string;
  /** Vertical focus of the cover picture, 0 (top) to 100 (bottom). */
  coverY?: number;
  organiser?: OrganiserIdentity;
  updatedAt?: any;
}

/** Self-described: AgoraX does not check or verify organisers. */
export interface OrganiserIdentity {
  enabled: boolean;
  kind: 'individual' | 'organisation';
  name: string;
  about?: string;
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
