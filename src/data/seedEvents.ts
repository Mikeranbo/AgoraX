/**
 * AgoraX — seed events for the Groningen demand test.
 *
 * These are the 40 events shown on the validation landing page. ACLO already covers sports
 * (bouldering, padel, boxing, fencing, basketball, table tennis, swimming, running, cycling and
 * e-sports), so those are not on the list.
 * Prices are the LOW tier (we are optimising for signups, not margin).
 *
 * Earnings shown to a potential organiser are calculated, never stored:
 *   gross      = price * minParticipants
 *   platformFee= gross * 0.07
 *   costs      = fixedCost + perPersonCost * minParticipants
 *   net        = gross - platformFee - costs
 *   perHost    = net / hostsNeeded
 *
 * "Uni room free" means a room a student association can book for free in Groningen, so
 * fixedCost is 0 unless something has to be paid for (name tags, a prize pot, amp hire).
 * Two slugs are kept from the earlier list so their sign-ups carry over: themed-pub-quiz is now
 * Brain Battle and photography-challenge is now Photo Walk & Share.
 */

export const PLATFORM_FEE = 0.07;

export type SeedCategory =
  | 'Networking'
  | 'Games'
  | 'Creative'
  | 'Social'
  | 'Study'
  | 'Tech & Ideas'
  | 'Outdoor';

/** The drawing for a "How it works" step (components/StepArt.tsx). */
export type StepIcon =
  | 'tag' | 'users' | 'talk' | 'phone' | 'cards' | 'heart' | 'sign-up' | 'shuffle' | 'coffee' | 'pin' | 'walk' | 'door'
  | 'dice' | 'chef' | 'plate' | 'mic' | 'handshake' | 'pitch' | 'hand' | 'chart' | 'warning' | 'question' | 'briefcase'
  | 'spin' | 'timer' | 'trophy' | 'mask' | 'moon' | 'repeat' | 'crown' | 'book' | 'songs' | 'sun' | 'idea' | 'camera'
  | 'flame' | 'drop' | 'gift' | 'pen' | 'brush' | 'bag' | 'scissors' | 'stretch' | 'drama' | 'clapper' | 'popcorn' | 'vote'
  | 'list' | 'shirt' | 'rail' | 'pencil' | 'eye' | 'guitar' | 'music' | 'basket' | 'printer' | 'data' | 'laptop' | 'code'
  | 'scale' | 'languages' | 'train' | 'trees' | 'buoy' | 'waves' | 'tent' | 'car' | 'award' | 'film' | 'calendar' | 'puzzle';

export interface HowStep {
  icon: StepIcon;
  title: string;
  text: string;
}

export interface SeedEvent {
  /** Stable id — used as the Firestore document id so re-seeding overwrites instead of duplicating. */
  slug: string;
  title: string;
  /** A one-line hook, then two or three short paragraphs, separated by blank lines. */
  description: string;
  category: SeedCategory;
  /** Price in EUR shown to participants. 0 = free event. */
  price: number;
  /** Threshold the event must reach to run. */
  minParticipants: number;
  /** Rough length of the event, in hours. */
  durationHours: number;
  /** People needed to run it. */
  hostsNeeded: number;
  /** Costs the organiser pays once, regardless of headcount (name tags, a prize pot, amp hire). */
  fixedCost: number;
  /** Costs that scale per person (ingredients, clay, rental, lesson). */
  perPersonCost: number;
  /** What the venue note says people bring themselves; empty when nothing. */
  bringYourOwn: string;
  /** Where it happens and what is there. */
  venueNote: string;
  /** 'any' = runnable now, 'spring' = shown but clearly marked as a spring trip. */
  season: 'any' | 'spring';
  emoji: string;
  /** Used for the generated cover when there is no photo. */
  accent: string;
  /** "How it works" on the event page: three or four steps. Not stored in Firestore. */
  steps: HowStep[];
}

/** Paragraphs of a description, joined the way the event page splits them. */
const text = (...paragraphs: string[]) => paragraphs.join('\n\n');

const base = { season: 'any' as const, bringYourOwn: '' };

export const SEED_EVENTS: SeedEvent[] = [
  // ------------------------------------------------------------ Networking
  {
    ...base,
    slug: 'pure-networking-night',
    title: 'Pure Networking Night',
    category: 'Networking',
    description: text(
      'A room full of students and a name tag that starts the conversation for you.',
      "There's no programme and nobody gives a talk. Your name tag says \"Ask me about...\" and you finish the sentence yourself: your thesis, the band you play in, the city you grew up in. Then you walk around and talk.",
      "It's for anyone who finds the first sentence the hardest part. The tag gives people something to ask, so you never need an opener. First-years, master's students and PhDs end up in the same conversations.",
      "You'll probably leave with a few new names in your phone and one or two conversations you want to continue over coffee.",
    ),
    price: 3, minParticipants: 20, durationHours: 2, hostsNeeded: 1, fixedCost: 5, perPersonCost: 0,
    venueNote: 'Uni room free · name tags', emoji: '🏷️', accent: '#6B3FD6',
    steps: [
      { icon: 'tag', title: 'Fill in your tag', text: 'Write what people can ask you about.' },
      { icon: 'users', title: 'Walk up to someone', text: "Read their tag and ask about it. That's the whole opener." },
      { icon: 'talk', title: 'Move on when you like', text: 'Stay in one conversation or switch every ten minutes.' },
      { icon: 'phone', title: 'Swap details', text: 'Save the people you want to see again before the night ends.' },
    ],
  },
  {
    ...base,
    slug: 'social-challenge-night',
    title: 'Social Challenge Night',
    category: 'Networking',
    description: text(
      "A deck of small social challenges to get you talking to people you'd normally walk past.",
      "At the door everyone gets a few challenge cards. Swap Instagrams with five people. Talk to five people you haven't met. Find one person you could talk to for an hour. You do them at your own pace, and nobody checks.",
      'At the end you open the app and tag each other for the most interesting conversation, the funniest moment and the best listener. Nobody wins anything. It is simply a nice way to hear what you were like to talk to.',
      'Good for people who like a bit of structure, and for anyone new to Groningen who wants to meet a lot of people in one evening.',
    ),
    price: 4, minParticipants: 20, durationHours: 2.5, hostsNeeded: 2, fixedCost: 10, perPersonCost: 0,
    venueNote: 'Uni room free · challenge cards', emoji: '🃏', accent: '#D64F8B',
    steps: [
      { icon: 'cards', title: 'Pick up your cards', text: 'Each card is one small challenge, like swapping Instagrams with five people.' },
      { icon: 'talk', title: 'Go and do them', text: "Any order, at your own pace. Skip the ones that don't suit you." },
      { icon: 'award', title: 'Tag each other', text: 'In the app: most interesting conversation, funniest, best listener. No scores.' },
      { icon: 'heart', title: 'Keep in touch', text: 'You already have their Instagram, so following up is easy.' },
    ],
  },
  {
    ...base,
    slug: 'coffee-roulette',
    title: 'Coffee Roulette',
    category: 'Networking',
    description: text(
      'We pair you with another student and a café. You bring the curiosity and buy your own coffee.',
      'Sign up and we match you with someone from a different programme or year. You meet at a café in the city, order your own drink and talk for about an hour and a half.',
      "It suits people who find big groups tiring. You only have one conversation to think about, and it's with someone who also signed up to meet someone new.",
      'Some pairs meet once. Others turn it into a weekly coffee.',
    ),
    price: 2, minParticipants: 12, durationHours: 1.5, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Café · buy your own coffee', bringYourOwn: 'Money for your own coffee', emoji: '☕', accent: '#B5651D',
    steps: [
      { icon: 'sign-up', title: 'Sign up', text: "Tell us roughly when you're free." },
      { icon: 'shuffle', title: 'Get your match', text: 'We pair you with another student and pick a café.' },
      { icon: 'coffee', title: 'Meet for coffee', text: 'Buy your own drink and talk for an hour or so.' },
    ],
  },
  {
    ...base,
    slug: 'walk-and-talk-groningen',
    title: 'Walk & Talk Groningen',
    category: 'Networking',
    description: text(
      'An easy walk through the city in a small group, talking as you go.',
      'We walk for about an hour and a half at a relaxed pace, along the canals or through a park. Walking side by side makes talking easier, especially if sitting across a table from a stranger feels awkward.',
      "Groups are small, around eight people, so everyone gets to talk. Wear shoes you can walk in and bring a jacket, because it's Groningen.",
      "If you're new here, it's also an easy way to see corners of the city you'd otherwise miss.",
    ),
    price: 2, minParticipants: 8, durationHours: 1.5, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Outdoors', emoji: '🚶', accent: '#2F9E6B',
    steps: [
      { icon: 'pin', title: 'Meet at the start', text: 'The meeting point is shared once the walk is confirmed.' },
      { icon: 'walk', title: 'Walk and talk', text: 'About an hour and a half at an easy pace.' },
      { icon: 'shuffle', title: 'Swap walking partners', text: 'People mix along the way, so you talk to most of the group.' },
    ],
  },
  {
    ...base,
    slug: 'newcomers-night',
    title: 'Newcomers Night',
    category: 'Networking',
    description: text(
      "For people who arrived in Groningen recently and don't know many people yet.",
      "Moving to a new city gets easier once you know a few faces. This is an evening in a uni room with other newcomers, whether you came from abroad or from another Dutch city.",
      'We start with a couple of light games so nobody has to break the ice alone, then the evening is open. People swap tips on everything from bike repairs to the cheapest supermarket.',
      'You leave knowing people in the same situation, which makes the first months a lot less lonely.',
    ),
    price: 3, minParticipants: 15, durationHours: 2, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni room free', emoji: '👋', accent: '#E0A33A',
    steps: [
      { icon: 'door', title: 'Come as you are', text: "You don't need to know anyone. Most people won't." },
      { icon: 'dice', title: 'Short warm-up games', text: 'A few quick games so the first conversations start by themselves.' },
      { icon: 'talk', title: 'Swap tips', text: 'Bikes, housing, groceries: ask the people who figured it out last month.' },
      { icon: 'calendar', title: 'Make plans', text: 'Find people to explore the city with in the weeks after.' },
    ],
  },
  {
    ...base,
    slug: 'international-potluck',
    title: 'International Potluck',
    category: 'Networking',
    description: text(
      'Everyone brings a dish from home, and the table ends up covering half the world.',
      'We use a shared kitchen for the evening. You bring one dish, ideally something from where you grew up, and say a few words about it if you like. Then everyone eats.',
      "It's the easiest way to try food you'd never order yourself, and food gives everyone something to talk about. Cooking skills don't matter. A simple family recipe works well.",
      'Bring a container, since there are often leftovers to take home.',
    ),
    price: 2, minParticipants: 12, durationHours: 3, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Shared kitchen free · bring a dish', bringYourOwn: 'A dish to share', emoji: '🍲', accent: '#E0702F',
    steps: [
      { icon: 'chef', title: 'Cook one dish', text: 'Something from home if you can, enough for a few people to try.' },
      { icon: 'plate', title: 'Put it on the table', text: 'Tell people what it is and where it comes from.' },
      { icon: 'heart', title: 'Taste everything', text: "Fill a plate and talk to whoever's next to you." },
    ],
  },
  {
    ...base,
    slug: 'startup-founders-meetup',
    title: 'Startup Founders Meetup',
    category: 'Networking',
    description: text(
      'For students who are building something, or want to, and would like to talk to others doing the same.',
      "A relaxed meetup in a uni room. People say in a minute what they're working on and where they're stuck, then the room breaks into small conversations. Projects range from a company with paying customers to an idea that only exists in a notebook.",
      'You can ask the questions that are hard to ask anywhere else, like how others found their first users or kept going next to their studies.',
      "You might find a co-founder. More often you'll find people who tell you honestly what they think of your idea.",
    ),
    price: 3, minParticipants: 12, durationHours: 2, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni room free', emoji: '🚀', accent: '#2E7FD6',
    steps: [
      { icon: 'mic', title: 'One-minute intros', text: "Say what you're building and where you need help." },
      { icon: 'users', title: 'Small groups', text: 'Join the conversations that sound useful to you.' },
      { icon: 'handshake', title: 'Follow up', text: 'Swap details with the people you want to keep talking to.' },
    ],
  },
  {
    ...base,
    slug: 'pitch-and-find-your-team',
    title: 'Pitch & Find Your Team',
    category: 'Networking',
    description: text(
      "Pitch an idea in two minutes, or find a project you'd like to join.",
      'Anyone with an idea gets two minutes on the projector to explain it and say what help they need. After all the pitches, everyone taps "I\'d join" on the projects they like.',
      "You don't need an idea to come. Plenty of people come to find something worth working on, whether that's a startup or a small weekend project.",
      'At the end every pitcher sees who wants to join, so teams can start talking that same evening.',
    ),
    price: 4, minParticipants: 15, durationHours: 2.5, hostsNeeded: 2, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni room + projector free', emoji: '🎯', accent: '#C2413B',
    steps: [
      { icon: 'pitch', title: 'Pitch in two minutes', text: 'Ideas go on the projector, one after another.' },
      { icon: 'hand', title: 'Tap "I\'d join"', text: "Mark the projects you'd want to work on." },
      { icon: 'users', title: 'Meet your team', text: "Pitchers see who's interested and start talking right there." },
    ],
  },
  {
    ...base,
    slug: 'trading-strategy-meetup',
    title: 'Trading Strategy Meetup',
    category: 'Networking',
    description: text(
      'Students who trade, or want to understand trading, comparing notes. Not financial advice.',
      'A small group in a uni room sharing what they actually do: how they decide when to get in, and what went wrong last month. People show their own charts and explain their thinking.',
      "Nobody here is a licensed adviser and nothing said in the room is financial advice. It's about learning from each other's mistakes before they cost you money.",
      'Beginners are welcome. Bring your questions and hear how other students approach the market, including what they wish they had known earlier.',
    ),
    price: 3, minParticipants: 10, durationHours: 2, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni room free', emoji: '📈', accent: '#2F9E6B',
    steps: [
      { icon: 'chart', title: 'Bring a strategy', text: "Or just questions, if you're starting out." },
      { icon: 'talk', title: 'Talk it through', text: "People share what works for them and what didn't." },
      { icon: 'warning', title: 'Remember the rule', text: 'This is experience-sharing. It is not financial advice.' },
    ],
  },
  {
    ...base,
    slug: 'internship-and-career-stories',
    title: 'Internship & Career Stories',
    category: 'Networking',
    description: text(
      "Students who've done internships tell you how they got them and what they were like.",
      "A few students and recent graduates talk for ten minutes each about an internship or first job, how they applied and what the work was like day to day. Then it opens up for questions.",
      "It's useful in your second or third year, when everyone around you seems to be applying somewhere and you're not sure where to start.",
      'You hear honest stories from people a year or two ahead of you, which is often more useful than a careers fair.',
    ),
    price: 3, minParticipants: 12, durationHours: 2, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni room free', emoji: '💼', accent: '#5A5A6E',
    steps: [
      { icon: 'mic', title: 'Short stories', text: 'Students share how they found their internship.' },
      { icon: 'question', title: 'Ask anything', text: "Applications, pay, workload: the questions you'd skip at a careers fair." },
      { icon: 'briefcase', title: 'Make contacts', text: 'Talk to the speakers afterwards about your own applications.' },
    ],
  },

  // ---------------------------------------------------------------- Games
  {
    ...base,
    slug: 'themed-pub-quiz',
    title: 'Brain Battle',
    category: 'Games',
    description: text(
      'Team logic puzzles you solve by reasoning together, with no trivia knowledge needed.',
      "Teams of four to six sit at round tables. A spinning top picks the next question envelope, and every team gets one minute to discuss it before the captain writes down an answer. The questions are riddles you can work out with logic, so a good discussion counts for more than knowing facts.",
      "Players can also submit their own questions. If no team cracks yours, you win the point. There's a €20 prize pot for the winning team.",
      "Come with friends or come alone and join a team on the night. You'll be surprised how differently people think about the same question.",
    ),
    price: 5, minParticipants: 24, durationHours: 2.5, hostsNeeded: 2, fixedCost: 20, perPersonCost: 0,
    venueNote: 'Bar back room free · €20 prize pot', emoji: '🧠', accent: '#E0A33A',
    steps: [
      { icon: 'users', title: 'Form a team', text: 'Four to six people per round table. Solo players join a team.' },
      { icon: 'spin', title: 'Spin the top', text: 'It picks which question envelope opens next.' },
      { icon: 'timer', title: 'One minute to think', text: 'Discuss as a team, then the captain writes the answer.' },
      { icon: 'trophy', title: 'Stump the room', text: 'Submit your own question. If nobody cracks it, the point is yours.' },
    ],
  },
  {
    ...base,
    slug: 'mafia-werewolf-night',
    title: 'Mafia / Werewolf Night',
    category: 'Games',
    description: text(
      'A night of bluffing and accusing your friends with a straight face.',
      'Everyone gets a secret role. At night the werewolves pick a victim; during the day the village argues about who to vote out. A moderator runs each round, so you only have to learn the rules once.',
      'It works best with about a dozen players, which is why it needs twelve people to run. New players usually get the hang of it within one round.',
      'Expect to suspect your closest friends and to find out who in the group lies best.',
    ),
    price: 3, minParticipants: 12, durationHours: 2.5, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni room free', emoji: '🐺', accent: '#8B3FD6',
    steps: [
      { icon: 'mask', title: 'Get a secret role', text: 'Villager, werewolf or one of the special roles.' },
      { icon: 'moon', title: 'Night falls', text: 'The werewolves quietly choose who to eliminate.' },
      { icon: 'talk', title: 'Argue it out', text: 'In the day phase everyone debates and votes someone out.' },
      { icon: 'repeat', title: 'Play again', text: "Rounds are short, so you'll try several roles." },
    ],
  },
  {
    ...base,
    slug: 'chess-challenge',
    title: 'Chess Challenge',
    category: 'Games',
    description: text(
      'Relaxed chess for every level, from "I know how the knight moves" upwards.',
      "Turn up and we'll pair you with someone at a similar level. There are clocks for quick games and quieter boards for people who'd rather take their time.",
      'Play as many games as you like. If you lose, ask your opponent to go through the game with you. Most players are happy to show you where it turned.',
      "Beginners are welcome. If you only know the rules, you'll find someone at your level.",
    ),
    price: 3, minParticipants: 10, durationHours: 2, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni room free', emoji: '♟️', accent: '#5A5A6E',
    steps: [
      { icon: 'crown', title: 'Find a partner', text: 'We pair players of a similar level.' },
      { icon: 'timer', title: 'Play', text: 'Quick games on the clock, or slower ones without.' },
      { icon: 'eye', title: 'Look back at it', text: 'Go through the game together and see where it turned.' },
    ],
  },
  {
    ...base,
    slug: 'board-game-discovery',
    title: 'Board-Game Discovery',
    category: 'Games',
    description: text(
      "An evening of board games you haven't played yet, explained by people who love them.",
      "Tables with a mix of games, from quick card games to longer strategy ones. If you own a game you like, bring it and teach it. If you don't, sit down at any table and someone will explain the rules.",
      "Three hours gives you time for one long game or a handful of short ones. It's an easy evening if you're shy, since the game does a lot of the talking.",
      "You'll leave with a few new favourites and people to play them with again.",
    ),
    price: 4, minParticipants: 12, durationHours: 3, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni room free · bring your own games', bringYourOwn: 'A game you like, if you have one', emoji: '🎲', accent: '#D64F8B',
    steps: [
      { icon: 'dice', title: 'Pick a table', text: 'Each table has a game and someone who knows it.' },
      { icon: 'book', title: 'Learn the rules', text: 'A quick explanation, then you play.' },
      { icon: 'shuffle', title: 'Switch games', text: 'Move to another table whenever a game ends.' },
    ],
  },
  {
    ...base,
    slug: 'karaoke-night',
    title: 'Karaoke Night',
    category: 'Games',
    description: text(
      "Sing in a bar's back room where the audience cheers for everyone, in tune or not.",
      'The bar lets us use the back room for free as long as we buy our drinks there. You pick songs from a long list and sing alone, or drag a friend up with you.',
      'Nobody comes for a perfect voice. The best moments are usually the songs the whole room knows the words to.',
      "If you don't want to sing, come and cheer. Plenty of people only pick up the mic after watching for a while.",
    ),
    price: 3, minParticipants: 15, durationHours: 2.5, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Bar back room free with drinks', emoji: '🎤', accent: '#C2413B',
    steps: [
      { icon: 'songs', title: 'Choose a song', text: 'Pick from the list and add your name.' },
      { icon: 'mic', title: 'Take the mic', text: 'Sing alone or with friends.' },
      { icon: 'users', title: 'Cheer the others', text: 'Every performance gets applause.' },
    ],
  },
  {
    ...base,
    slug: 'park-games',
    title: 'Park Games (Spikeball, Frisbee, Kubb)',
    category: 'Games',
    description: text(
      'Easy outdoor games in a city park, with gear to share.',
      "We meet in a park on a dry afternoon and rotate between Spikeball, frisbee and kubb, the Scandinavian game where you knock over wooden blocks. If you have your own set, bring it. If not, there's shared gear.",
      'No experience needed. The games are quick to learn and teams keep changing, so you end up playing with most people there.',
      'Bring water and something to sit on for the breaks.',
    ),
    price: 2, minParticipants: 10, durationHours: 2, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Park · own or shared gear', bringYourOwn: 'Your own gear, if you have some', emoji: '🥏', accent: '#2F9E6B',
    steps: [
      { icon: 'pin', title: 'Meet in the park', text: 'The spot is shared once the afternoon is confirmed.' },
      { icon: 'shuffle', title: 'Rotate games', text: 'Spikeball, frisbee and kubb, with teams that keep changing.' },
      { icon: 'sun', title: 'Take breaks', text: 'Sit in the grass between rounds and talk.' },
    ],
  },

  // ------------------------------------------------------------- Creative
  {
    ...base,
    slug: 'photography-challenge',
    title: 'Photo Walk & Share',
    category: 'Creative',
    description: text(
      'Walk the city with a theme in mind, then share what you shot over coffee.',
      'We pick a theme, like reflections or people at work, and spend a couple of hours walking through Groningen taking photos. A phone camera is fine. Then we sit down at a café and pass the photos around.',
      "There's no voting and no winner. It's interesting to see how many different photos people take of the same streets.",
      "Beginners and people who already shoot a lot both fit in, and you'll look at the city differently on your way home.",
    ),
    price: 3, minParticipants: 10, durationHours: 3, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Outdoors · café to share photos', emoji: '📷', accent: '#2E7FD6',
    steps: [
      { icon: 'idea', title: 'Get the theme', text: 'One theme for the whole group, announced at the start.' },
      { icon: 'camera', title: 'Walk and shoot', text: 'Spread out or stick together, as you like.' },
      { icon: 'coffee', title: 'Share at a café', text: 'Show a few favourites and see what others saw.' },
    ],
  },
  {
    ...base,
    slug: 'clay-making-workshop',
    title: 'Clay-Making Workshop',
    category: 'Creative',
    description: text(
      'Three hours at a pottery studio, getting your hands dirty on the wheel.',
      'A potter shows you how to centre clay on the wheel and pull up a simple cup or bowl. Then you try it yourself, as many times as it takes.',
      'Most of the €25 goes to the studio and the clay. Nobody expects a good bowl on the first try, and the wobbly ones are half the fun.',
      "It's a slow, absorbing way to spend an evening, and everyone around you will be just as muddy.",
    ),
    price: 25, minParticipants: 10, durationHours: 3, hostsNeeded: 1, fixedCost: 0, perPersonCost: 15,
    venueNote: 'Pottery studio', emoji: '🏺', accent: '#B5651D',
    steps: [
      { icon: 'hand', title: 'Watch a demo', text: 'The potter shows how to centre and shape the clay.' },
      { icon: 'spin', title: 'Try the wheel', text: 'Make a cup or bowl yourself, with help when you need it.' },
      { icon: 'users', title: 'Compare results', text: 'See what everyone made, wobbly ones included.' },
    ],
  },
  {
    ...base,
    slug: 'candle-making',
    title: 'Candle Making',
    category: 'Creative',
    description: text(
      'Pour your own scented candles in a uni room, then take them home.',
      'We bring the wax, wicks, scents and jars. You melt the wax, mix a scent you like and pour. While the candles set, there is time to talk and decorate your jar.',
      "It's calm and easy, so it works well if you want something creative without much pressure. Most of the €18 pays for materials.",
      'You leave with candles you made yourself. They make good gifts.',
    ),
    price: 18, minParticipants: 10, durationHours: 2, hostsNeeded: 1, fixedCost: 0, perPersonCost: 8,
    venueNote: 'Uni room free · wax + jars', emoji: '🕯️', accent: '#E0A33A',
    steps: [
      { icon: 'flame', title: 'Melt the wax', text: 'Wax, wicks and jars are ready on the table.' },
      { icon: 'drop', title: 'Choose a scent', text: 'Mix your own from the scents on offer.' },
      { icon: 'gift', title: 'Pour and take home', text: 'Pour into your jar, let it set and take it with you.' },
    ],
  },
  {
    ...base,
    slug: 'tote-bag-painting',
    title: 'Tote-Bag Painting',
    category: 'Creative',
    description: text(
      'Paint your own tote bag and walk out carrying it.',
      "Plain cotton bags and fabric paint are on the table. Sketch a design first if you like, or paint straight onto the bag. There are stencils for anyone who doesn't want to draw freehand.",
      "You don't need to be good at drawing. Simple shapes and lettering look great on a bag.",
      "Two hours is enough to finish one bag and talk to the people next to you about theirs.",
    ),
    price: 10, minParticipants: 12, durationHours: 2, hostsNeeded: 1, fixedCost: 0, perPersonCost: 5,
    venueNote: 'Uni room free · bags + paint', emoji: '👜', accent: '#D64F8B',
    steps: [
      { icon: 'pen', title: 'Sketch an idea', text: 'On paper first, or straight onto the bag.' },
      { icon: 'brush', title: 'Paint it', text: 'Fabric paint and stencils are provided.' },
      { icon: 'bag', title: 'Carry it home', text: 'Let it dry and take your bag with you.' },
    ],
  },
  {
    ...base,
    slug: 'collage-and-zine-night',
    title: 'Collage & Zine Night',
    category: 'Creative',
    description: text(
      'Cut up magazines, glue things together and make a small zine of your own.',
      'A zine is a homemade mini magazine, often folded from a single sheet. We bring old magazines, scissors, glue and paper. You make collages, write a little if you like, and fold it into a booklet.',
      "There's no theme you have to follow. Some people make something personal, others something silly. You can swap copies at the end.",
      "It's a good evening if you like making things with your hands and don't want to be judged on skill.",
    ),
    price: 5, minParticipants: 10, durationHours: 2.5, hostsNeeded: 1, fixedCost: 20, perPersonCost: 0,
    venueNote: 'Uni room free · materials', emoji: '✂️', accent: '#8B3FD6',
    steps: [
      { icon: 'scissors', title: 'Cut and collect', text: 'Go through magazines and cut out what catches your eye.' },
      { icon: 'cards', title: 'Glue it together', text: 'Build pages from your cut-outs and your own words.' },
      { icon: 'book', title: 'Fold your zine', text: 'Turn one sheet into a small booklet and swap copies.' },
    ],
  },
  {
    ...base,
    slug: 'improv-theatre-workshop',
    title: 'Improv Theatre Workshop',
    category: 'Creative',
    description: text(
      'Learn the basics of improv in a friendly room where mistakes are part of the game.',
      'The host leads two hours of games and short scenes. You start with warm-ups that get everyone moving and laughing, then build up to small scenes in pairs.',
      'No acting experience needed. Improv is mostly about listening and going along with what your partner offers, which also helps in presentations and job interviews.',
      "You'll leave more relaxed about speaking up in front of people, and probably sore from laughing.",
    ),
    price: 6, minParticipants: 12, durationHours: 2, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni room free', emoji: '🎭', accent: '#C2413B',
    steps: [
      { icon: 'stretch', title: 'Warm up', text: 'Quick games to loosen up.' },
      { icon: 'users', title: 'Play in pairs', text: 'Short scenes built from a single word or suggestion.' },
      { icon: 'drama', title: 'Show a scene', text: 'Groups can try a scene in front of the room.' },
    ],
  },
  {
    ...base,
    slug: 'short-film-challenge',
    title: 'Short-Film Challenge',
    category: 'Creative',
    description: text(
      'Make a short film in one day with a team and the phones in your pockets.',
      'Teams get a theme and a few rules at the start, then have about six hours to write, shoot and edit a film of a few minutes. Uni rooms are free to use as sets and editing space.',
      "You don't need film experience. Teams mix people who like writing, acting, filming or editing, and roles get sorted out on the day.",
      'At the end we watch all the films together. Seeing what the other teams made from the same theme is the best part.',
    ),
    price: 8, minParticipants: 12, durationHours: 6, hostsNeeded: 2, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni rooms free · own phones', bringYourOwn: 'A phone that can film', emoji: '🎬', accent: '#C2413B',
    steps: [
      { icon: 'idea', title: 'Get the theme', text: 'Every team receives the same theme and rules.' },
      { icon: 'clapper', title: 'Shoot it', text: 'Write and film with your phones around the building.' },
      { icon: 'film', title: 'Edit', text: 'Cut it together before the deadline.' },
      { icon: 'popcorn', title: 'Watch together', text: 'Every film gets screened at the end.' },
    ],
  },
  {
    ...base,
    slug: 'film-club',
    title: 'Film Club (watch + talk)',
    category: 'Creative',
    description: text(
      'Watch a good film on a big screen, then talk about it with people who just saw it too.',
      'A uni room with a projector and decent sound. We watch one film, picked in advance from suggestions, then stay for half an hour to talk about it.',
      "The conversation afterwards is what makes it different from going to the cinema alone. You don't need to know anything about film to have an opinion.",
      'Bring snacks if you want. Regulars help choose the next film.',
    ),
    price: 3, minParticipants: 10, durationHours: 3, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni room + AV free', emoji: '🍿', accent: '#5A5A6E',
    steps: [
      { icon: 'vote', title: 'Vote on the film', text: 'Pick from a short list beforehand.' },
      { icon: 'popcorn', title: 'Watch together', text: 'Big screen, lights off.' },
      { icon: 'talk', title: 'Talk it over', text: 'Half an hour of discussion after the credits.' },
    ],
  },
  {
    ...base,
    slug: 'poetry-open-mic',
    title: 'Poetry Open Mic',
    category: 'Creative',
    description: text(
      "Read your own poem or someone else's, or just come and listen.",
      'Put your name on the list and you get a few minutes at the microphone. Read something you wrote, a poem you love or a lyric that stuck with you. Any language is fine.',
      'The room is quiet and supportive, and plenty of people come only to listen. First-time readers are common, and nerves are expected.',
      "It's a calm evening, very different from most student nights.",
    ),
    price: 3, minParticipants: 15, durationHours: 2, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni room or café free', emoji: '🎙️', accent: '#8B3FD6',
    steps: [
      { icon: 'list', title: 'Sign up', text: 'Add your name to the list on the night.' },
      { icon: 'mic', title: 'Read', text: 'A few minutes each, in any language.' },
      { icon: 'heart', title: 'Listen', text: 'Or just come to hear the others.' },
    ],
  },
  {
    ...base,
    slug: 'thrift-and-style-swap',
    title: 'Thrift & Style Swap',
    category: 'Creative',
    description: text(
      "Bring clothes you don't wear anymore and swap them for something new to you.",
      'We set up rails in a uni room. You bring clean clothes you no longer wear, hang them up and take whatever you like from the rails in return.',
      "It's free new clothes and less waste, and it's fun to see someone else wear the jacket you never did.",
      'Clothes left at the end go to a charity shop.',
    ),
    price: 4, minParticipants: 15, durationHours: 2, hostsNeeded: 2, fixedCost: 15, perPersonCost: 0,
    venueNote: 'Uni room free · rails', emoji: '👕', accent: '#D64F8B',
    steps: [
      { icon: 'shirt', title: 'Bring clothes', text: "Clean, wearable pieces you're done with." },
      { icon: 'rail', title: 'Hang them up', text: "Put them on the rails with everyone else's." },
      { icon: 'bag', title: 'Take your pick', text: 'Choose something new to you and take it home.' },
    ],
  },
  {
    ...base,
    slug: 'sketch-and-social',
    title: 'Sketch & Social',
    category: 'Creative',
    description: text(
      "Draw together in a relaxed room, at whatever level you're at.",
      'We bring paper, pencils and a few things to draw, and sometimes someone volunteers to pose. You sketch and chat. Every half hour or so people swap seats and look at each other\'s work.',
      "It's meant to be low pressure. Plenty of people haven't drawn since school.",
      "You leave with a few pages of sketches and maybe a habit you'd like to keep.",
    ),
    price: 6, minParticipants: 10, durationHours: 2, hostsNeeded: 1, fixedCost: 20, perPersonCost: 0,
    venueNote: 'Uni room free · materials', emoji: '✏️', accent: '#5A5A6E',
    steps: [
      { icon: 'pencil', title: 'Grab a pencil', text: 'Materials are on the table.' },
      { icon: 'eye', title: 'Draw what you see', text: 'Objects, the room, or a volunteer model.' },
      { icon: 'shuffle', title: 'Swap seats', text: "Move around and look at other people's sketches." },
    ],
  },
  {
    ...base,
    slug: 'music-jam-night',
    title: 'Music Jam Night',
    category: 'Creative',
    description: text(
      "Bring your instrument and play along with people you've never played with.",
      'We book a uni music room and hire a couple of amps. Someone starts a groove, others join in, and songs grow from there. Guitar, keys, bass, a voice or a shaker: anything fits.',
      "You don't need to be in a band. Simple chords are enough to join, and the more experienced players are happy to keep things easy.",
      'It is a good way to find people to start a band with, or just to play loud for an evening.',
    ),
    price: 5, minParticipants: 12, durationHours: 2.5, hostsNeeded: 1, fixedCost: 25, perPersonCost: 0,
    venueNote: 'Uni music room free · amp hire', emoji: '🎸', accent: '#E0702F',
    steps: [
      { icon: 'guitar', title: 'Bring your instrument', text: 'The room has drums, and we hire the amps.' },
      { icon: 'music', title: 'Join in', text: 'Someone starts a groove and others follow.' },
      { icon: 'shuffle', title: 'Swap places', text: 'Change instruments and line-ups through the night.' },
    ],
  },

  // ---------------------------------------------------------------- Social
  {
    ...base,
    slug: 'beginner-salsa-social',
    title: 'Beginner Salsa Social',
    category: 'Social',
    description: text(
      'Learn your first salsa steps with an instructor, then dance.',
      'A teacher takes the first hour through the basic step and a few simple turns. The second hour is social dancing: the music goes on, partners change, and you practise what you just learned.',
      "You don't need a partner or any experience. Everyone dances with everyone, so you'll meet most of the room.",
      'The €9 mostly covers the instructor. Wear shoes that turn easily on the floor.',
    ),
    price: 9, minParticipants: 16, durationHours: 2, hostsNeeded: 1, fixedCost: 60, perPersonCost: 0,
    venueNote: 'Uni room free · instructor', emoji: '💃', accent: '#D64F8B',
    steps: [
      { icon: 'walk', title: 'Learn the basics', text: 'An instructor teaches the first steps.' },
      { icon: 'shuffle', title: 'Rotate partners', text: 'Everyone dances with everyone.' },
      { icon: 'music', title: 'Social dancing', text: 'Put it into practice with the music on.' },
    ],
  },
  {
    ...base,
    slug: 'cooking-challenge',
    title: 'Cooking Challenge',
    category: 'Social',
    description: text(
      'Teams get the same ingredients and three hours to cook the best dish.',
      'We take over a shared kitchen and split into small teams. Every team gets the same basket of ingredients plus a few basics, and has to turn it into a meal.',
      'At the end everyone tastes everything and votes. Expect at least one disaster and some surprisingly good food.',
      "You don't have to be a good cook. A team needs people who chop and taste as much as it needs a chef.",
    ),
    price: 15, minParticipants: 12, durationHours: 3, hostsNeeded: 2, fixedCost: 0, perPersonCost: 8,
    venueNote: 'Shared kitchen free · ingredients', emoji: '🍳', accent: '#E0A33A',
    steps: [
      { icon: 'basket', title: 'Get your basket', text: 'Every team gets the same ingredients.' },
      { icon: 'chef', title: 'Cook as a team', text: 'Plan, chop and cook your dish.' },
      { icon: 'plate', title: 'Taste and vote', text: 'Try every dish and pick a favourite.' },
    ],
  },
  {
    ...base,
    slug: 'reading-meetup',
    title: 'Reading Meetup',
    category: 'Social',
    description: text(
      'A small, free meetup for people who like to read and want to talk about it.',
      "Six to ten people in a uni room or a café. Everyone brings whatever they're reading and talks about it for a few minutes. There's no shared book and no homework.",
      "It's a good way to find your next book and meet people who read, which is harder than it sounds.",
      "It's free, and you're welcome to just listen.",
    ),
    price: 0, minParticipants: 6, durationHours: 2, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni room or café free', emoji: '📖', accent: '#5A5A6E',
    steps: [
      { icon: 'book', title: 'Bring your book', text: "Whatever you're reading now." },
      { icon: 'talk', title: 'Tell us about it', text: 'A few minutes each, with or without spoilers.' },
      { icon: 'list', title: 'Take tips home', text: 'Leave with a list of books to try next.' },
    ],
  },

  // ----------------------------------------------------------------- Study
  {
    ...base,
    slug: 'mock-exam-session',
    title: 'Mock Exam Session',
    category: 'Study',
    description: text(
      'Sit a practice exam under real conditions before the real one.',
      'Send us a past exam for your course and we print it. We set up a quiet room, keep time strictly, and you write it like the real thing. Afterwards you go through the answers in small groups.',
      'It shows you where you actually stand, and doing the hard parts once under time pressure makes exam day less stressful.',
      'Good for the weeks before exams. Everyone works on their own paper, so the courses in the room can differ.',
    ),
    price: 5, minParticipants: 15, durationHours: 3, hostsNeeded: 2, fixedCost: 10, perPersonCost: 0,
    venueNote: 'Uni room free · printing', emoji: '📝', accent: '#2E7FD6',
    steps: [
      { icon: 'printer', title: 'Print your exam', text: 'Send us a past paper for your course.' },
      { icon: 'timer', title: 'Write it on the clock', text: 'Silent room, strict time.' },
      { icon: 'users', title: 'Check together', text: 'Go through the answers in small groups.' },
    ],
  },

  // ---------------------------------------------------------- Tech & Ideas
  {
    ...base,
    slug: 'machine-learning-jam',
    title: 'Machine-Learning Jam',
    category: 'Tech & Ideas',
    description: text(
      'Four hours to build a small machine-learning project with other students.',
      'We pick a few public datasets and problems. You join a small team, choose one, and try to get a working model by the end.',
      "Beginners pair with people who have done it before, so it's a good place to learn. If you already know your way around, it's an excuse to try something new.",
      "At the end teams show what they built, including what didn't work.",
    ),
    price: 5, minParticipants: 12, durationHours: 4, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni room free', emoji: '🤖', accent: '#6B3FD6',
    steps: [
      { icon: 'data', title: 'Pick a dataset', text: 'Choose from a short list of problems.' },
      { icon: 'laptop', title: 'Build in a team', text: 'Train a model and see what works.' },
      { icon: 'pitch', title: 'Show results', text: 'Each team demos what they made.' },
    ],
  },
  {
    ...base,
    slug: 'build-an-app-challenge',
    title: 'Build an App Challenge',
    category: 'Tech & Ideas',
    description: text(
      'Spend an afternoon turning an idea into a working app with a small team.',
      'Teams form at the start around ideas people bring. You build until the deadline, with snacks to keep you going. No-code tools are allowed.',
      "Teams need designers as much as coders, and you learn a lot in a few hours by watching how others work.",
      'Every team demos its app at the end. Some keep working on theirs afterwards.',
    ),
    price: 5, minParticipants: 15, durationHours: 5, hostsNeeded: 2, fixedCost: 0, perPersonCost: 2,
    venueNote: 'Uni room free · snacks', emoji: '💻', accent: '#2F9E6B',
    steps: [
      { icon: 'idea', title: 'Pick an idea', text: 'Join a team around an idea you like.' },
      { icon: 'code', title: 'Build it', text: "Code, design or test, whatever you're good at." },
      { icon: 'phone', title: 'Demo', text: 'Show your app to the room.' },
    ],
  },
  {
    ...base,
    slug: 'friendly-debate',
    title: 'Friendly Debate',
    category: 'Tech & Ideas',
    description: text(
      'Argue a side you might not agree with, in a room where nobody takes it personally.',
      'We pick a few light topics and a few serious ones. Two small teams get a side each and a few minutes to prepare, then debate with simple rules and a timer.',
      'Arguing the side you disagree with is harder than it sounds, and good practice for thinking on your feet.',
      'After each round the audience asks questions, and anyone can join the next debate.',
    ),
    price: 3, minParticipants: 12, durationHours: 2, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni room free', emoji: '⚖️', accent: '#5A5A6E',
    steps: [
      { icon: 'scale', title: 'Get a side', text: 'Topics and sides are drawn at random.' },
      { icon: 'timer', title: 'Prepare quickly', text: 'A few minutes with your team.' },
      { icon: 'mic', title: 'Debate', text: 'Timed speeches, then questions from the room.' },
    ],
  },
  {
    ...base,
    slug: 'language-exchange-games',
    title: 'Language Exchange Games',
    category: 'Tech & Ideas',
    description: text(
      'Practise a language by playing games with people who speak it.',
      "Tables are grouped by language, from Dutch to Spanish to whatever people bring. You play simple word games at a table for the language you're learning, then switch and help others with yours.",
      "Because you're playing a game, it's much easier to speak without worrying about mistakes. Every level is welcome.",
      "It's also an easy way to find a regular language partner.",
    ),
    price: 3, minParticipants: 16, durationHours: 2, hostsNeeded: 2, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Uni room free', emoji: '🗣️', accent: '#E0A33A',
    steps: [
      { icon: 'languages', title: 'Pick a table', text: 'Choose the language you want to practise.' },
      { icon: 'dice', title: 'Play', text: 'Word games and quizzes at your level.' },
      { icon: 'repeat', title: 'Switch roles', text: 'Help someone else with your own language.' },
    ],
  },

  // --------------------------------------------------------------- Outdoor
  {
    ...base,
    slug: 'hiking-trip',
    title: 'Hiking Trip',
    category: 'Outdoor',
    description: text(
      'A day walk outside the city with a group and a packed lunch.',
      'We take the train out of Groningen and walk for most of the day through the countryside, with breaks along the way. You buy your own train ticket.',
      'The pace is easy and the land is flat, so normal fitness is enough.',
      'Bring sturdy shoes, rain gear and food for the day.',
    ),
    price: 3, minParticipants: 10, durationHours: 6, hostsNeeded: 1, fixedCost: 0, perPersonCost: 0,
    venueNote: 'Own train ticket', bringYourOwn: 'Your own train ticket', emoji: '🥾', accent: '#2F9E6B',
    steps: [
      { icon: 'train', title: 'Take the train', text: 'Meet at the station with your own ticket.' },
      { icon: 'trees', title: 'Walk', text: 'Most of the day on foot, with breaks.' },
      { icon: 'sun', title: 'Head back', text: 'Back in Groningen by the evening.' },
    ],
  },
  {
    ...base,
    slug: 'kayaking-adventure',
    title: 'Kayaking Adventure',
    category: 'Outdoor',
    description: text(
      'Three hours of paddling in a group, no experience needed.',
      'We rent kayaks as a group and paddle on quiet water near the city. A short safety briefing at the start covers what you need to know.',
      "You can share a double kayak if you'd rather not paddle alone. The €20 mostly covers the rental.",
      'Bring clothes that can get wet and a change for afterwards.',
    ),
    price: 20, minParticipants: 10, durationHours: 3, hostsNeeded: 1, fixedCost: 0, perPersonCost: 15,
    venueNote: 'Group kayak rental', emoji: '🛶', accent: '#2E7FD6',
    steps: [
      { icon: 'buoy', title: 'Safety briefing', text: 'Learn the basics before you get in.' },
      { icon: 'waves', title: 'Paddle', text: 'Three hours on the water at an easy pace.' },
      { icon: 'sun', title: 'Dry off', text: 'Change and warm up afterwards.' },
    ],
  },
  {
    ...base,
    slug: 'camping-weekend',
    title: 'Camping Weekend',
    category: 'Outdoor',
    season: 'spring',
    description: text(
      'A spring weekend at a campsite, cooking on a stove and staying up outside.',
      'We book a campsite for a weekend in spring. You bring your own tent and sleeping bag, or share with friends. The price covers the pitch.',
      'Days are for walks and doing very little. In the evening we cook together and talk until late.',
      "It's a spring trip, shown now to see who would come.",
    ),
    price: 12, minParticipants: 10, durationHours: 36, hostsNeeded: 1, fixedCost: 0, perPersonCost: 8,
    venueNote: 'Campsite · own gear', bringYourOwn: 'Your own camping gear', emoji: '🏕️', accent: '#2F9E6B',
    steps: [
      { icon: 'tent', title: 'Pitch your tent', text: 'Bring your own gear or share.' },
      { icon: 'flame', title: 'Cook together', text: 'Evening meals on camping stoves.' },
      { icon: 'moon', title: 'Stay up late', text: "Talk outside until you're tired." },
    ],
  },
  {
    ...base,
    slug: 'beginner-surfing-trip',
    title: 'Beginner Surfing Trip',
    category: 'Outdoor',
    season: 'spring',
    description: text(
      'A day at the coast with a group surf lesson for complete beginners.',
      'We book a group lesson at a surf school on the coast. An instructor teaches you to stand up on small waves, and most of the €25 goes to the lesson.',
      'You arrange your own transport to the beach. Carpooling with others from the group is easy to set up.',
      "It's planned for spring, when the water is a little less cold. Expect to fall off a lot and laugh about it.",
    ),
    price: 25, minParticipants: 10, durationHours: 10, hostsNeeded: 1, fixedCost: 0, perPersonCost: 20,
    venueNote: 'Group lesson · own transport', bringYourOwn: 'Your own transport', emoji: '🏄', accent: '#2E7FD6',
    steps: [
      { icon: 'car', title: 'Get to the coast', text: 'Arrange transport, or carpool with the group.' },
      { icon: 'waves', title: 'Take the lesson', text: 'An instructor works with beginners in small waves.' },
      { icon: 'sun', title: 'Relax on the beach', text: 'Warm up and swap wipe-out stories.' },
    ],
  },
];

/** Steps for events that aren't on the seed list (approved proposals). */
export const DEFAULT_STEPS: HowStep[] = [
  { icon: 'hand', title: 'Say you\'re interested', text: "It's free and it isn't a booking." },
  { icon: 'users', title: 'We gather enough people', text: 'Once enough people are interested, we look for a host and a place.' },
  { icon: 'calendar', title: 'We set a date', text: 'Interested people hear first when it is confirmed.' },
];

/** "How it works" for an event: its own steps when it's a seed event, otherwise the default. */
export function stepsFor(slug?: string): HowStep[] {
  return SEED_EVENTS.find((e) => e.slug === slug)?.steps ?? DEFAULT_STEPS;
}

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
