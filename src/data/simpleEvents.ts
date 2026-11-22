/**
 * concept-simple: the 12 events shown by default, and the plain answers each card and event
 * page gives. Chosen because they are free or cheap, Mike can run them alone without an
 * instructor or a special venue, and students asked for them in the interviews and the survey.
 *
 * An event's own `visible` field (set from /admin) overrides this list. Prices: an event with
 * no real cost is Free; otherwise the price is exactly the cost per person (fixedCost shared
 * over the minimum, plus perPersonCost), and `pays` says what that buys.
 */
export interface SimpleCopy {
  /** What you do there, in one or two short sentences. */
  does: string;
  /** What is there for you. */
  included: string;
  /** What you bring yourself; '' for nothing. */
  bring: string;
  /** Shown price in euros: 0 = Free. */
  price: number;
  /** What the price pays for, or why it is free. */
  pays: string;
  /** Why it is on the shortlist (for /admin and the notes, never shown to students). */
  why: string;
}

export const SIMPLE_EVENTS: Record<string, SimpleCopy> = {
  'chess-challenge': {
    does: 'Play relaxed chess against someone at your level. Quick games on a clock, or slow ones without.',
    included: 'Boards, pieces, clocks and a room.',
    bring: '',
    price: 0,
    pays: 'Free. The room costs nothing.',
    why: 'Three survey answers asked for chess (a tournament, chess in a café); boards are all it needs.',
  },
  'film-club': {
    does: 'Watch one film on a big screen, then stay half an hour to talk about it.',
    included: 'A uni room with a projector and sound. You help pick the film.',
    bring: 'Snacks, if you want them.',
    price: 0,
    pays: 'Free. The room and projector cost nothing.',
    why: 'Movies came up in interviews and three survey answers asked for a movie or film night.',
  },
  'photography-challenge': {
    does: 'Walk the city for a couple of hours with one photo theme, then show your favourites at a café.',
    included: 'The theme and the route.',
    bring: 'Your phone. Money for a coffee if you want one.',
    price: 0,
    pays: 'Free. You only pay for your own coffee.',
    why: 'Two survey answers asked for a photo walk or street photography session; a phone is enough.',
  },
  'mafia-werewolf-night': {
    does: 'Get a secret role, then bluff and vote people out. A host runs every round, so you learn as you play.',
    included: 'Role cards, a host and a room.',
    bring: '',
    price: 0,
    pays: 'Free. The room costs nothing.',
    why: 'A survey answer asked for exactly this; one host and a deck of cards run it.',
  },
  'reading-meetup': {
    does: 'Tell the group about the book you are reading for a few minutes, and hear what the others are reading.',
    included: 'A room or a café table. There is no shared book and no homework.',
    bring: 'The book you are reading now.',
    price: 0,
    pays: 'Free.',
    why: 'Two survey answers asked for a reading night; books came up in the interviews too.',
  },
  'board-game-discovery': {
    does: "Learn and play board games you haven't tried, from quick card games to longer ones.",
    included: 'Tables, a room, and someone at each table who explains the rules.',
    bring: 'A game you like, if you have one.',
    price: 0,
    pays: 'Free. The room costs nothing.',
    why: 'Game nights are what students already organise for friends (survey); people bring the games.',
  },
  'park-games': {
    does: 'Play Spikeball, frisbee and kubb in a city park, with teams that keep changing.',
    included: 'Shared gear for all three games.',
    bring: 'Water and something to sit on.',
    price: 0,
    pays: 'Free.',
    why: 'Sport is the most common hobby in the interviews and survey; a park needs no booking.',
  },
  'walk-and-talk-groningen': {
    does: 'Walk through the city at an easy pace for about an hour and a half, talking as you go.',
    included: 'The route and a small group of about eight.',
    bring: 'Shoes you can walk in and a jacket.',
    price: 0,
    pays: 'Free.',
    why: 'Walking came up in the survey; it costs nothing and suits newcomers.',
  },
  'international-potluck': {
    does: 'Bring one dish from home, put it on the shared table and try everyone else’s.',
    included: 'A shared kitchen and a table.',
    bring: 'One dish for a few people to try, and a container for leftovers.',
    price: 0,
    pays: 'Free. Everyone brings the food.',
    why: 'Cooking and dinners came up in the interviews and the survey; a shared kitchen is free.',
  },
  'tote-bag-painting': {
    does: 'Paint your own cotton tote bag and take it home.',
    included: 'A plain cotton bag, fabric paint, brushes and stencils.',
    bring: '',
    price: 5,
    pays: '€5 = your bag and the fabric paint.',
    why: 'Survey answers asked for art events; the only cost is the bag and paint, €5 a person.',
  },
  'hiking-trip': {
    does: 'Take the train out of Groningen and walk through the countryside for most of the day.',
    included: 'The route and the group.',
    bring: 'Your own train ticket, sturdy shoes, rain gear and food for the day.',
    price: 0,
    pays: 'Free. You only pay your own train ticket.',
    why: 'Hiking and walking came up in the survey; Mike can lead it alone.',
  },
  'karaoke-night': {
    does: "Sing in a bar's back room, or just cheer for the people who do.",
    included: 'The back room and the song list.',
    bring: 'Money for your own drinks.',
    price: 0,
    pays: 'Free. The bar lends the room as long as we buy our drinks there.',
    why: 'Going out, parties and drinks were the biggest theme in the interviews; the bar provides the room.',
  },
};

/** Shown when no event has its own `visible` field yet. */
export const DEFAULT_VISIBLE = new Set(Object.keys(SIMPLE_EVENTS));

/** On the shortlist? The event's own `visible` (from /admin) wins over the default 12. */
export function isShortlisted(e: { id: string; visible?: boolean }): boolean {
  return typeof e.visible === 'boolean' ? e.visible : DEFAULT_VISIBLE.has(e.id);
}

/** The event with its concept-simple price: Free when it has no real cost. */
export function withSimplePrice<T extends { id: string; price: number }>(e: T): T {
  const copy = SIMPLE_EVENTS[e.id];
  return copy ? { ...e, price: copy.price } : e;
}
