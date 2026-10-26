/** The three opening messages. The highlighted words get the blue-to-violet gradient. */
export interface EntryMessage {
  /** Headline as [before, highlighted, after]. */
  headline: [string, string, string];
  body: string;
  /** Key of its cut-out (one person, background removed) in photoManifest (public/images/entry). */
  photo: string;
  /**
   * The original photo cut the person off at its right and bottom edges, so the cut-out sits flush
   * in the screen's bottom-right corner (right edge on phones), where those cuts stay out of sight.
   */
  flush?: boolean;
}

export const ENTRY_MESSAGES: EntryMessage[] = [
  {
    headline: ['Meet new, ', 'like-minded', ' people.'],
    body: 'Find people who share your interests and enjoy doing things together.',
    photo: 'entry-guitar',
    flush: true,
  },
  {
    headline: ['Have fun trying ', 'new activities', '.'],
    body: 'Explore new hobbies, join adventures, and discover your next favourite thing.',
    photo: 'entry-climbing',
  },
  {
    headline: ['', 'Earn money', ' organising events.'],
    body: 'Create an event, bring people together, and get paid for making it happen.',
    photo: 'entry-cooking',
    flush: true,
  },
];

/** The cube rolls to the next message this often (ms). */
export const ROLL_EVERY_MS = 5200;

/** Message shown on cube step k (three messages on four faces). */
export const messageAt = (k: number) => ((k % 3) + 3) % 3;

/** Phones and narrow windows get the stacked mobile layout. */
export const MOBILE_QUERY = '(max-width: 759px)';
