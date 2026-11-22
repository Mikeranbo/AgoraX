/**
 * Page A (concept-simple): the four plain answers each card and event page gives, for every seed
 * event. Page A lists the same events as page B, at the same prices (the seed prices).
 *
 * An event's own `visible` field (the "On page A" tick on /admin) can take it off page A; without
 * it, every event is shown. `pays` says what the shown price buys: the costs per person at the
 * minimum headcount, and the host who keeps the rest.
 */
export interface SimpleCopy {
  /** What you do there, in one or two short sentences. */
  does: string;
  /** What is there for you. */
  included: string;
  /** What you bring yourself; '' for nothing. */
  bring: string;
  /** What the shown (seed) price pays for. Starts with "Free" for a free event. */
  pays: string;
  /** Why it was on the first shortlist of 12 (notes only, never shown to students). */
  why?: string;
}

export const SIMPLE_EVENTS: Record<string, SimpleCopy> = {
  // ------------------------------------------------------------ Networking
  'pure-networking-night': {
    does: 'Walk around a room full of students and talk. Your name tag says what people can ask you about.',
    included: 'A uni room and a name tag.',
    bring: '',
    pays: '€3 pays for the name tags and the host who runs it. The room is free.',
  },
  'social-challenge-night': {
    does: 'Pick up a few small challenge cards, like swapping Instagrams with five people, and do them at your own pace.',
    included: 'A uni room, the challenge cards and two hosts.',
    bring: 'Your phone.',
    pays: '€4 pays for the cards and the two hosts. The room is free.',
  },
  'coffee-roulette': {
    does: 'We pair you with a student from another programme. You meet at a café and talk for about an hour and a half.',
    included: 'Your match and a café to meet at.',
    bring: 'Money for your own coffee.',
    pays: '€2 pays the host who makes the matches. You buy your own coffee.',
  },
  'walk-and-talk-groningen': {
    does: 'Walk through the city at an easy pace for about an hour and a half, talking as you go.',
    included: 'The route and a small group of about eight.',
    bring: 'Shoes you can walk in and a jacket.',
    pays: '€2 pays the host who leads the walk.',
    why: 'Walking came up in the survey; it costs nothing and suits newcomers.',
  },
  'newcomers-night': {
    does: 'Meet other people who moved to Groningen recently. A couple of light games first, then the evening is open.',
    included: 'A uni room and a host who runs the games.',
    bring: '',
    pays: '€3 pays the host who runs it. The room is free.',
  },
  'international-potluck': {
    does: 'Bring one dish from home, put it on the shared table and try everyone else’s.',
    included: 'A shared kitchen and a table.',
    bring: 'One dish for a few people to try, and a container for leftovers.',
    pays: '€2 pays the host who runs it. Everyone brings the food.',
    why: 'Cooking and dinners came up in the interviews and the survey; a shared kitchen is free.',
  },
  'startup-founders-meetup': {
    does: "Say in a minute what you're building and where you're stuck, then talk it through in small groups.",
    included: 'A uni room and a host who keeps the intros short.',
    bring: "Your idea, even if it's only in a notebook.",
    pays: '€3 pays the host who runs it. The room is free.',
  },
  'pitch-and-find-your-team': {
    does: 'Pitch an idea in two minutes, or tap "I\'d join" on the projects you like. Teams start talking the same evening.',
    included: 'A uni room with a projector, and two hosts.',
    bring: 'An idea if you have one. You can come without.',
    pays: '€4 pays the two hosts. The room and projector are free.',
  },
  'trading-strategy-meetup': {
    does: 'Students show their own charts and explain how they trade, including what went wrong. It is not financial advice.',
    included: 'A uni room and a small group.',
    bring: 'Your charts, or just your questions.',
    pays: '€3 pays the host who runs it. The room is free.',
  },
  'internship-and-career-stories': {
    does: 'A few students tell you how they found their internship and what the work was like. Then you ask them anything.',
    included: 'A uni room and students a year or two ahead of you.',
    bring: 'Your questions.',
    pays: '€3 pays the host who runs it. The room is free.',
  },

  // ---------------------------------------------------------------- Games
  'themed-pub-quiz': {
    does: "Solve logic puzzles in a team of four to six. They take reasoning, so you don't need to know trivia.",
    included: "A bar's back room, the puzzles and a €20 prize for the winning team.",
    bring: 'Friends for your team, or come alone and join one.',
    pays: '€5 pays for the €20 prize and the two hosts. The back room is free.',
  },
  'mafia-werewolf-night': {
    does: 'Get a secret role, then bluff and vote people out. A host runs every round, so you learn as you play.',
    included: 'Role cards, a host and a room.',
    bring: '',
    pays: '€3 pays the host who runs every round. The room is free.',
    why: 'A survey answer asked for exactly this; one host and a deck of cards run it.',
  },
  'chess-challenge': {
    does: 'Play relaxed chess against someone at your level. Quick games on a clock, or slow ones without.',
    included: 'Boards, pieces, clocks and a room.',
    bring: '',
    pays: '€3 pays the host who runs it. The room is free.',
    why: 'Three survey answers asked for chess (a tournament, chess in a café); boards are all it needs.',
  },
  'board-game-discovery': {
    does: "Learn and play board games you haven't tried, from quick card games to longer ones.",
    included: 'Tables, a room, and someone at each table who explains the rules.',
    bring: 'A game you like, if you have one.',
    pays: '€4 pays the host who runs it. The room is free.',
    why: 'Game nights are what students already organise for friends (survey); people bring the games.',
  },
  'karaoke-night': {
    does: "Sing in a bar's back room, or just cheer for the people who do.",
    included: 'The back room and the song list.',
    bring: 'Money for your own drinks.',
    pays: '€3 pays the host who runs it. The bar lends the room as long as we buy our drinks there.',
    why: 'Going out, parties and drinks were the biggest theme in the interviews; the bar provides the room.',
  },
  'park-games': {
    does: 'Play Spikeball, frisbee and kubb in a city park, with teams that keep changing.',
    included: 'Shared gear for all three games.',
    bring: 'Water and something to sit on.',
    pays: '€2 pays the host who runs it. The park is free.',
    why: 'Sport is the most common hobby in the interviews and survey; a park needs no booking.',
  },

  // --------------------------------------------------------------- Sports
  'ping-pong-tournament': {
    does: 'Play short matches against people at your level, then a quick knockout to find the winner.',
    included: 'Tables, bats and balls.',
    bring: '',
    pays: '€3 pays the host who runs it. The uni tables are free to book.',
  },
  'padel-tournament': {
    does: 'Play doubles with a new partner every match, so you play with everyone. It ends with a friendly final.',
    included: 'Two padel courts for two and a half hours. Rackets can be shared.',
    bring: 'Sports shoes.',
    pays: '€12: about €8 for the courts, the rest for the host who runs it.',
  },
  'tennis-tournament': {
    does: 'Play short doubles matches on indoor courts, with partners who keep changing. The best pairs play a final.',
    included: 'Two indoor courts for two and a half hours, and balls.',
    bring: 'Sports shoes, and a racket if you have one. Rackets can be shared.',
    pays: '€12: about €9 for the courts, the rest for the host who runs it.',
  },

  // ------------------------------------------------------------- Creative
  'photography-challenge': {
    does: 'Walk the city for a couple of hours with one photo theme, then show your favourites at a café.',
    included: 'The theme and the route.',
    bring: 'Your phone. Money for a coffee if you want one.',
    pays: '€3 pays the host who picks the theme and the route. You buy your own coffee.',
    why: 'Two survey answers asked for a photo walk or street photography session; a phone is enough.',
  },
  'clay-making-workshop': {
    does: 'A potter shows you how to centre clay on the wheel. Then you make a cup or bowl yourself.',
    included: 'The pottery studio, the clay and help at the wheel.',
    bring: 'Clothes that can get muddy.',
    pays: '€25: €15 for the studio and your clay, the rest for the host who runs it.',
  },
  'candle-making': {
    does: 'Melt wax, mix a scent you like and pour your own candles. You take them home.',
    included: 'Wax, wicks, scents and jars, in a uni room.',
    bring: '',
    pays: '€18: €8 for your wax, wicks and jars, the rest for the host who runs it.',
  },
  'tote-bag-painting': {
    does: 'Paint your own cotton tote bag and take it home.',
    included: 'A plain cotton bag, fabric paint, brushes and stencils.',
    bring: '',
    pays: '€10: €5 for your bag and the fabric paint, the rest for the host who runs it.',
    why: 'Survey answers asked for art events; the only cost is the bag and paint, €5 a person.',
  },
  'collage-and-zine-night': {
    does: 'Cut up old magazines, glue the pieces into collages and fold them into a small zine of your own.',
    included: 'Magazines, scissors, glue and paper.',
    bring: '',
    pays: '€5: about €2 for the materials, the rest for the host who runs it. The room is free.',
  },
  'improv-theatre-workshop': {
    does: 'Start with warm-up games, then play short scenes in pairs. Mistakes are part of the game.',
    included: 'A uni room and a host who leads it.',
    bring: 'Clothes you can move in.',
    pays: '€6 pays the host who leads it. The room is free.',
  },
  'short-film-challenge': {
    does: 'Write, shoot and edit a short film in one day with a team, using your phones. At the end everyone watches all the films.',
    included: 'Uni rooms to film and edit in, the theme, and two hosts.',
    bring: 'A phone that can film.',
    pays: '€8 pays the two hosts for the day. The rooms are free.',
  },
  'film-club': {
    does: 'Watch one film on a big screen, then stay half an hour to talk about it.',
    included: 'A uni room with a projector and sound. You help pick the film.',
    bring: 'Snacks, if you want them.',
    pays: '€3 pays the host who runs it. The room and projector are free.',
    why: 'Movies came up in interviews and three survey answers asked for a movie or film night.',
  },
  'poetry-open-mic': {
    does: "Read a poem for a few minutes, your own or someone else's, in any language. Or just come and listen.",
    included: 'A microphone in a quiet uni room or café.',
    bring: 'A poem, if you want to read.',
    pays: '€3 pays the host who runs it. The room is free.',
  },
  'thrift-and-style-swap': {
    does: "Hang up clothes you don't wear anymore and take home something new to you from the rails.",
    included: 'Clothing rails in a uni room. Clothes left at the end go to a charity shop.',
    bring: 'Clean clothes you no longer wear.',
    pays: '€4: about €1 for the rails, the rest for the two hosts.',
  },
  'sketch-and-social': {
    does: 'Draw objects, the room or a volunteer model while you chat. Every half hour you swap seats and look at the others.',
    included: 'Paper, pencils and things to draw.',
    bring: '',
    pays: '€6: about €2 for paper and pencils, the rest for the host who runs it. The room is free.',
  },
  'music-jam-night': {
    does: "Play along with people you've never played with. Someone starts a groove and the others join in.",
    included: 'A uni music room with drums, and hired amps.',
    bring: 'Your instrument, or your voice.',
    pays: '€5: about €2 for the amp hire, the rest for the host who runs it.',
  },

  // ---------------------------------------------------------------- Social
  'beginner-salsa-social': {
    does: 'An instructor teaches you the basic step and a few turns. Then you dance for an hour with partners who keep changing.',
    included: "A uni room and an instructor. You don't need a partner.",
    bring: 'Shoes that turn easily on the floor.',
    pays: '€9: about €4 for the instructor, the rest for the host who runs it.',
  },
  'cooking-challenge': {
    does: 'Your team gets the same basket of ingredients as the others and three hours to cook a meal. Then everyone tastes and votes.',
    included: 'A shared kitchen and the ingredients.',
    bring: '',
    pays: '€15: €8 for your ingredients, the rest for the two hosts.',
  },
  'reading-meetup': {
    does: 'Tell the group about the book you are reading for a few minutes, and hear what the others are reading.',
    included: 'A room or a café table. There is no shared book and no homework.',
    bring: 'The book you are reading now.',
    pays: 'Free.',
    why: 'Two survey answers asked for a reading night; books came up in the interviews too.',
  },

  // ----------------------------------------------------------------- Study
  'mock-exam-session': {
    does: 'Write a past exam for your course in a quiet room, on a strict clock. Then go through the answers in small groups.',
    included: 'A quiet room, your printed exam and two hosts who keep time.',
    bring: 'Pens. You send us the past exam beforehand.',
    pays: '€5: under €1 for printing, the rest for the two hosts.',
  },

  // ---------------------------------------------------------- Tech & Ideas
  'machine-learning-jam': {
    does: 'Join a small team, pick a public dataset and try to get a working model in four hours.',
    included: 'A uni room, a short list of datasets, and people who have done it before.',
    bring: 'A laptop.',
    pays: '€5 pays the host who runs it. The room is free.',
  },
  'build-an-app-challenge': {
    does: 'Build a working app with a small team in one afternoon. No-code tools are allowed.',
    included: 'A uni room and snacks to keep you going.',
    bring: 'A laptop.',
    pays: '€5: €2 for snacks, the rest for the two hosts.',
  },
  'friendly-debate': {
    does: 'Get a side at random, prepare for a few minutes with your team, then debate on a timer.',
    included: 'A uni room, the topics and a host with the timer.',
    bring: '',
    pays: '€3 pays the host who runs it. The room is free.',
  },
  'language-exchange-games': {
    does: "Play word games at a table for the language you're learning, then switch and help others with yours.",
    included: 'A uni room, the games and two hosts.',
    bring: '',
    pays: '€3 pays the two hosts. The room is free.',
  },

  // --------------------------------------------------------------- Outdoor
  'hiking-trip': {
    does: 'Take the train out of Groningen and walk through the countryside for most of the day.',
    included: 'The route and the group.',
    bring: 'Your own train ticket, sturdy shoes, rain gear and food for the day.',
    pays: '€3 pays the host who leads the walk. You buy your own train ticket.',
    why: 'Hiking and walking came up in the survey; Mike can lead it alone.',
  },
  'kayaking-adventure': {
    does: 'Paddle for three hours on quiet water near the city, after a short safety briefing.',
    included: 'Your kayak for the afternoon and the safety briefing.',
    bring: 'Clothes that can get wet, and a change for afterwards.',
    pays: '€20: €15 for the kayak rental, the rest for the host who runs it.',
  },
  'camping-weekend': {
    does: 'Spend a spring weekend at a campsite. Walks in the day, then cooking together and talking until late.',
    included: 'Your place at the campsite.',
    bring: 'Your own tent and sleeping bag, or share with friends.',
    pays: '€12: €8 for your place at the campsite, the rest for the host who runs it.',
  },
  'beginner-surfing-trip': {
    does: 'Spend a spring day at the coast and take a group surf lesson for complete beginners.',
    included: 'The lesson with a surf instructor.',
    bring: 'Your own transport to the beach. Carpooling with the group is easy to set up.',
    pays: '€25: €20 for the lesson, the rest for the host who runs it.',
  },
};

/** On page A? Every event is, unless /admin took it off (its own `visible` field). */
export function isOnPageA(e: { visible?: boolean }): boolean {
  return e.visible !== false;
}
