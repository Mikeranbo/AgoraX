/**
 * AgoraX — seed events for the Groningen demand test.
 *
 * These are the 33 events shown on the validation landing page.
 * Prices are the LOW tier (we are optimising for signups, not margin).
 *
 * Earnings shown to a potential organiser are calculated, never stored:
 *   gross      = price * minParticipants
 *   platformFee= gross * 0.07
 *   costs      = fixedCost + perPersonCost * minParticipants
 *   net        = gross - platformFee - costs
 *   perHost    = net / hostsNeeded
 *
 * "University space" means a room, hall, court, table or pool that a student
 * association can book for free in Groningen, so fixedCost is 0 for those.
 */

export const PLATFORM_FEE = 0.07;

export type SeedCategory =
  | 'Sports'
  | 'Games'
  | 'Creative'
  | 'Social'
  | 'Study'
  | 'Tech & Ideas'
  | 'Outdoor';

export interface SeedEvent {
  /** Stable id — used as the Firestore document id so re-seeding overwrites instead of duplicating. */
  slug: string;
  title: string;
  description: string;
  category: SeedCategory;
  /** Price in EUR shown to participants. 0 = free event. */
  price: number;
  /** Threshold the event must reach to run. */
  minParticipants: number;
  /** Rough length of the event, in hours. */
  durationHours: number;
  /** People needed to run it. A second host is added automatically above 20 participants. */
  hostsNeeded: number;
  /** Costs the organiser pays once, regardless of headcount (room hire, coach, prize pot). */
  fixedCost: number;
  /** Costs that scale per person (ingredients, clay, rental, lesson). */
  perPersonCost: number;
  /** Shown under the costs so people know what is NOT included. */
  bringYourOwn: string;
  /** Where it happens — drives the "free university space" copy. */
  venueNote: string;
  /** 'any' = runnable now, 'spring' = shown but clearly marked as a spring trip. */
  season: 'any' | 'spring';
  emoji: string;
  /** Used for the generated cover when there is no photo. */
  accent: string;
}

export const SEED_EVENTS: SeedEvent[] = [
  // ---------------------------------------------------------------- Sports
  {
    slug: 'beginner-bouldering',
    title: 'Beginner Bouldering',
    description:
      'Climb together and meet other beginners. No experience needed — we show you how to read a route and spot each other.',
    category: 'Sports',
    price: 4,
    minParticipants: 10,
    durationHours: 2,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'Gym entry and shoe hire paid at the door',
    venueNote: 'Climbing gym in Groningen',
    season: 'any',
    emoji: '🧗',
    accent: '#E0702F',
  },
  {
    slug: 'padel-cup',
    title: 'Padel Cup',
    description:
      'Rotating doubles matches so you play with everyone, then a friendly final. Rackets can be shared.',
    category: 'Sports',
    price: 12,
    minParticipants: 16,
    durationHours: 2.5,
    hostsNeeded: 1,
    fixedCost: 120,
    perPersonCost: 0,
    bringYourOwn: 'Sports shoes',
    venueNote: 'Two padel courts for 2.5 hours',
    season: 'any',
    emoji: '🎾',
    accent: '#2F9E6B',
  },
  {
    slug: 'boxing-martial-arts-intro',
    title: 'Boxing & Martial Arts Intro',
    description:
      'Learn the basics with a coach — stance, guard, simple combinations, and pad work with a partner. No contact sparring.',
    category: 'Sports',
    price: 12,
    minParticipants: 12,
    durationHours: 1.5,
    hostsNeeded: 1,
    fixedCost: 50,
    perPersonCost: 0,
    bringYourOwn: 'Sportswear; gloves provided',
    venueNote: 'University sports hall (free to book)',
    season: 'any',
    emoji: '🥊',
    accent: '#C2413B',
  },
  {
    slug: 'beginner-fencing',
    title: 'Beginner Fencing',
    description:
      'Learn basic techniques with an instructor from a local club: footwork, the lunge, and your first bouts in full kit.',
    category: 'Sports',
    price: 15,
    minParticipants: 12,
    durationHours: 1.5,
    hostsNeeded: 1,
    fixedCost: 120,
    perPersonCost: 0,
    bringYourOwn: 'Nothing — gear is included',
    venueNote: 'University sports hall (free to book)',
    season: 'any',
    emoji: '🤺',
    accent: '#6B3FD6',
  },
  {
    slug: 'pickup-basketball',
    title: 'Pickup Basketball',
    description:
      'Half-court games, teams reshuffled every few rounds so nobody sits out. All levels.',
    category: 'Sports',
    price: 3,
    minParticipants: 10,
    durationHours: 1.5,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'Indoor shoes',
    venueNote: 'University court (free to book)',
    season: 'any',
    emoji: '🏀',
    accent: '#E0702F',
  },
  {
    slug: 'ping-pong-challenge',
    title: 'Ping-Pong Challenge',
    description:
      'Short matches against players of similar ability, with a quick knockout at the end.',
    category: 'Sports',
    price: 3,
    minParticipants: 12,
    durationHours: 2,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'Nothing — bats and balls provided',
    venueNote: 'University tables (free to book)',
    season: 'any',
    emoji: '🏓',
    accent: '#2F9E6B',
  },
  {
    slug: 'swim-and-sauna',
    title: 'Swim & Sauna Session',
    description:
      'Lane swimming at your own pace, then the sauna. Good for anyone who used to swim and stopped after moving here.',
    category: 'Sports',
    price: 3,
    minParticipants: 12,
    durationHours: 1.5,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'Swimwear and a towel',
    venueNote: 'University pool (free to book)',
    season: 'any',
    emoji: '🏊',
    accent: '#2E7FD6',
  },
  {
    slug: 'running-club',
    title: 'Running Club',
    description:
      'An easy 5K at conversation pace, nobody left behind, coffee afterwards for whoever wants it.',
    category: 'Sports',
    price: 0,
    minParticipants: 6,
    durationHours: 1,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'Running shoes',
    venueNote: 'Meet at the Noorderplantsoen',
    season: 'any',
    emoji: '🏃',
    accent: '#2F9E6B',
  },

  // ----------------------------------------------------------------- Games
  {
    slug: 'mafia-werewolf-night',
    title: 'Mafia / Werewolf Night',
    description:
      'Bluff, accuse and work out who is lying. Rules explained in two minutes — you do not need to have played before.',
    category: 'Games',
    price: 3,
    minParticipants: 12,
    durationHours: 2.5,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'Nothing',
    venueNote: 'University room (free to book)',
    season: 'any',
    emoji: '🐺',
    accent: '#8B3FD6',
  },
  {
    slug: 'chess-challenge',
    title: 'Chess Challenge',
    description:
      'Beginner-friendly matches and a short mini-tournament. Paired by level, so you get real games rather than a massacre.',
    category: 'Games',
    price: 3,
    minParticipants: 10,
    durationHours: 2,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'Nothing — boards provided',
    venueNote: 'University room (free to book)',
    season: 'any',
    emoji: '♟️',
    accent: '#5A5A6E',
  },
  {
    slug: 'board-game-discovery',
    title: 'Board-Game Discovery',
    description:
      'Learn and play games you have not tried before. Bring one if you have it; there will be plenty either way.',
    category: 'Games',
    price: 4,
    minParticipants: 12,
    durationHours: 3,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'A game, if you have one',
    venueNote: 'University room (free to book)',
    season: 'any',
    emoji: '🎲',
    accent: '#D64F8B',
  },
  {
    slug: 'video-game-tournament',
    title: 'Video-Game Tournament',
    description:
      'A bracket on one chosen game, rotating between modern and retro titles each time. Spectating is half the fun.',
    category: 'Games',
    price: 5,
    minParticipants: 16,
    durationHours: 3,
    hostsNeeded: 2,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'Your own controller if you are picky',
    venueNote: 'University room with screens (free to book)',
    season: 'any',
    emoji: '🎮',
    accent: '#6B3FD6',
  },
  {
    slug: 'themed-pub-quiz',
    title: 'Themed Pub Quiz',
    description:
      'Team rounds on one theme per night — film, music, sport, or something properly obscure. Prize for the winning table.',
    category: 'Games',
    price: 5,
    minParticipants: 24,
    durationHours: 2,
    hostsNeeded: 2,
    fixedCost: 20,
    perPersonCost: 0,
    bringYourOwn: 'Your own drinks from the bar',
    venueNote: 'Back room of a bar (free with drinks)',
    season: 'any',
    emoji: '🍻',
    accent: '#E0A33A',
  },

  // -------------------------------------------------------------- Creative
  {
    slug: 'clay-making-workshop',
    title: 'Clay-Making Workshop',
    description:
      'Make and decorate a bowl, mug or small sculpture. Everything is fired afterwards and you collect it the following week.',
    category: 'Creative',
    price: 25,
    minParticipants: 10,
    durationHours: 3,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 15,
    bringYourOwn: 'Clothes you do not mind ruining',
    venueNote: 'Pottery studio — clay and firing included',
    season: 'any',
    emoji: '🏺',
    accent: '#B5651D',
  },
  {
    slug: 'short-film-challenge',
    title: 'Short-Film Challenge',
    description:
      'Teams get a prompt in the morning, then script, shoot and edit a short film by the evening. We watch them all together at the end.',
    category: 'Creative',
    price: 8,
    minParticipants: 12,
    durationHours: 6,
    hostsNeeded: 2,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'A phone and a laptop per team',
    venueNote: 'University rooms (free to book)',
    season: 'any',
    emoji: '🎬',
    accent: '#C2413B',
  },
  {
    slug: 'poetry-open-mic',
    title: 'Poetry Open Mic',
    description:
      'Read something you wrote, or come only to listen. Five minutes each, any language, no critique unless you ask for it.',
    category: 'Creative',
    price: 3,
    minParticipants: 15,
    durationHours: 2,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'Something to read, or nothing at all',
    venueNote: 'University room or café (free)',
    season: 'any',
    emoji: '🎤',
    accent: '#8B3FD6',
  },
  {
    slug: 'thrift-and-style-swap',
    title: 'Thrift & Style Swap',
    description:
      'Bring three things you never wear, leave with three you will. Plus honest second opinions from people with taste.',
    category: 'Creative',
    price: 4,
    minParticipants: 15,
    durationHours: 2,
    hostsNeeded: 2,
    fixedCost: 15,
    perPersonCost: 0,
    bringYourOwn: 'Three clean items of clothing',
    venueNote: 'University room (free) — rails hired',
    season: 'any',
    emoji: '👕',
    accent: '#D64F8B',
  },
  {
    slug: 'photography-challenge',
    title: 'Photography Challenge',
    description:
      'Walk the city with a theme, shoot for two hours, then everyone votes on the best three. Phone cameras entirely welcome.',
    category: 'Creative',
    price: 4,
    minParticipants: 10,
    durationHours: 3,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'A phone or a camera',
    venueNote: 'Outdoors, around the city',
    season: 'any',
    emoji: '📷',
    accent: '#2E7FD6',
  },
  {
    slug: 'sketch-and-social',
    title: 'Sketch & Social',
    description:
      'Drawing challenges and shared exercises — blind contour, 30-second poses, swapping sketchbooks. No skill required.',
    category: 'Creative',
    price: 6,
    minParticipants: 10,
    durationHours: 2,
    hostsNeeded: 1,
    fixedCost: 20,
    perPersonCost: 0,
    bringYourOwn: 'Nothing — paper and pencils provided',
    venueNote: 'University room (free to book)',
    season: 'any',
    emoji: '✏️',
    accent: '#5A5A6E',
  },
  {
    slug: 'music-jam-night',
    title: 'Music Jam Night',
    description:
      'Bring an instrument and play with people you have not played with before. Loose structure, a few agreed songs, mostly improvising.',
    category: 'Creative',
    price: 5,
    minParticipants: 12,
    durationHours: 2.5,
    hostsNeeded: 1,
    fixedCost: 25,
    perPersonCost: 0,
    bringYourOwn: 'Your instrument',
    venueNote: 'University music room (free) — amp hired',
    season: 'any',
    emoji: '🎸',
    accent: '#E0702F',
  },

  // ---------------------------------------------------------------- Social
  {
    slug: 'beginner-salsa-social',
    title: 'Beginner Salsa Social',
    description:
      'An hour of basic steps with an instructor, then an hour of dancing with everyone. Come alone — partners rotate.',
    category: 'Social',
    price: 9,
    minParticipants: 16,
    durationHours: 2,
    hostsNeeded: 1,
    fixedCost: 60,
    perPersonCost: 0,
    bringYourOwn: 'Shoes you can turn in',
    venueNote: 'University room (free) — instructor hired',
    season: 'any',
    emoji: '💃',
    accent: '#D64F8B',
  },
  {
    slug: 'cooking-challenge',
    title: 'Cooking Challenge',
    description:
      'Teams cook against the clock on a rotating cuisine, then everyone eats everything and argues about who won.',
    category: 'Social',
    price: 15,
    minParticipants: 12,
    durationHours: 3,
    hostsNeeded: 2,
    fixedCost: 0,
    perPersonCost: 8,
    bringYourOwn: 'An apron if you are precious about your clothes',
    venueNote: 'Shared kitchen — ingredients included',
    season: 'any',
    emoji: '🍳',
    accent: '#E0A33A',
  },
  {
    slug: 'reading-meetup',
    title: 'Reading Meetup',
    description:
      'Bring whatever you are reading, read in company for an hour, then talk about it with anyone who wants to. Silence is allowed.',
    category: 'Social',
    price: 0,
    minParticipants: 6,
    durationHours: 2,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'A book',
    venueNote: 'University room or café (free)',
    season: 'any',
    emoji: '📖',
    accent: '#5A5A6E',
  },

  // ----------------------------------------------------------------- Study
  {
    slug: 'mock-exam-session',
    title: 'Mock Exam Session',
    description:
      'Have a test coming up? Students who already passed it talk to the lecturer and build a practice exam from the same material. You sit it under real conditions — same time limit, no phones, no notes. Afterwards you get your result, go through the answers together, and hear what actually comes up and where people lose marks. Come out knowing where you stand, a week before it counts.',
    category: 'Study',
    price: 5,
    minParticipants: 15,
    durationHours: 3,
    hostsNeeded: 2,
    fixedCost: 10,
    perPersonCost: 0,
    bringYourOwn: 'A pen and whatever the real exam allows',
    venueNote: 'University room (free) — printing paid',
    season: 'any',
    emoji: '📝',
    accent: '#2E7FD6',
  },

  // --------------------------------------------------------- Tech & Ideas
  {
    slug: 'machine-learning-jam',
    title: 'Machine-Learning Jam',
    description:
      'A practical problem, small teams, four hours. Beginners get paired with someone who has done it before.',
    category: 'Tech & Ideas',
    price: 5,
    minParticipants: 12,
    durationHours: 4,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'A laptop',
    venueNote: 'University room (free to book)',
    season: 'any',
    emoji: '🤖',
    accent: '#6B3FD6',
  },
  {
    slug: 'build-an-app-challenge',
    title: 'Build an App Challenge',
    description:
      'Build a small working prototype in a day and demo it at the end. Designers and non-coders genuinely welcome.',
    category: 'Tech & Ideas',
    price: 5,
    minParticipants: 15,
    durationHours: 5,
    hostsNeeded: 2,
    fixedCost: 0,
    perPersonCost: 2,
    bringYourOwn: 'A laptop',
    venueNote: 'University room (free) — snacks included',
    season: 'any',
    emoji: '💻',
    accent: '#2F9E6B',
  },
  {
    slug: 'friendly-debate',
    title: 'Friendly Debate',
    description:
      'Structured debates on a rotating motion. You are assigned a side, which is the point — you argue things you do not believe.',
    category: 'Tech & Ideas',
    price: 3,
    minParticipants: 12,
    durationHours: 2,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'Nothing',
    venueNote: 'University room (free to book)',
    season: 'any',
    emoji: '⚖️',
    accent: '#5A5A6E',
  },
  {
    slug: 'language-exchange-games',
    title: 'Language Exchange Games',
    description:
      'Practise through games rather than small talk — tables per language, swap every twenty minutes. Dutch table every time.',
    category: 'Tech & Ideas',
    price: 3,
    minParticipants: 16,
    durationHours: 2,
    hostsNeeded: 2,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'Nothing',
    venueNote: 'University room (free to book)',
    season: 'any',
    emoji: '🗣️',
    accent: '#E0A33A',
  },

  // --------------------------------------------------------------- Outdoor
  {
    slug: 'hiking-trip',
    title: 'Hiking Trip',
    description:
      'A day route out of the city with the difficulty stated up front, so you know what you are signing up for.',
    category: 'Outdoor',
    price: 3,
    minParticipants: 10,
    durationHours: 6,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'Your train ticket, lunch and water',
    venueNote: 'Drenthe or the coast',
    season: 'any',
    emoji: '🥾',
    accent: '#2F9E6B',
  },
  {
    slug: 'cycling-adventure',
    title: 'Cycling Adventure',
    description:
      'A road or trail route with planned stops, at a pace the slowest person is comfortable with.',
    category: 'Outdoor',
    price: 3,
    minParticipants: 10,
    durationHours: 4,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 0,
    bringYourOwn: 'Your own bike',
    venueNote: 'Around Groningen',
    season: 'any',
    emoji: '🚴',
    accent: '#E0702F',
  },
  {
    slug: 'kayaking-adventure',
    title: 'Kayaking Adventure',
    description:
      'Explore the canals and waterways by kayak. Instruction at the start for anyone who has never paddled.',
    category: 'Outdoor',
    price: 20,
    minParticipants: 10,
    durationHours: 3,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 15,
    bringYourOwn: 'A change of clothes',
    venueNote: 'Kayaks rented at group rate',
    season: 'any',
    emoji: '🛶',
    accent: '#2E7FD6',
  },
  {
    slug: 'camping-weekend',
    title: 'Camping Weekend',
    description:
      'Camp, cook over fire and explore as a group. Shared tents can be arranged if you do not own one.',
    category: 'Outdoor',
    price: 12,
    minParticipants: 10,
    durationHours: 36,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 8,
    bringYourOwn: 'Tent, sleeping bag, travel and your share of food',
    venueNote: 'Campsite pitch included',
    season: 'spring',
    emoji: '🏕️',
    accent: '#2F9E6B',
  },
  {
    slug: 'beginner-surfing-trip',
    title: 'Beginner Surfing Trip',
    description:
      'A group lesson with a school on the coast, then the rest of the day at the beach. Wetsuits and boards from the school.',
    category: 'Outdoor',
    price: 25,
    minParticipants: 10,
    durationHours: 10,
    hostsNeeded: 1,
    fixedCost: 0,
    perPersonCost: 20,
    bringYourOwn: 'Your own transport and a towel',
    venueNote: 'North Sea coast — lesson included',
    season: 'spring',
    emoji: '🏄',
    accent: '#2E7FD6',
  },
];

/** What an organiser keeps if exactly minParticipants people turn up. */
export function organiserEarnings(
  e: Pick<SeedEvent, 'price' | 'minParticipants' | 'fixedCost' | 'perPersonCost' | 'hostsNeeded'>,
) {
  const gross = e.price * e.minParticipants;
  const platformFee = gross * PLATFORM_FEE;
  const costs = e.fixedCost + e.perPersonCost * e.minParticipants;
  const net = Math.max(0, gross - platformFee - costs);
  return {
    gross,
    platformFee,
    costs,
    net,
    perHost: net / Math.max(1, e.hostsNeeded),
  };
}
