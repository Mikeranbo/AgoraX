import React, { useId } from 'react';
import {
  Award, BookOpen, Briefcase, CalendarCheck, Camera, Car, ChartLine, ChefHat, CircleHelp, ClipboardList, Clapperboard, Code,
  Coffee, Crown, Database, Dices, DoorOpen, Drama, Droplet, Eye, Film, Flame, Footprints, Gift, Guitar, Hand, Handshake, Heart,
  Languages, Laptop, Layers, LifeBuoy, Lightbulb, ListMusic, MapPin, MessagesSquare, Mic, Moon, Music, Paintbrush, PenLine, Pencil,
  PersonStanding, Popcorn, Presentation, Printer, Puzzle, Repeat, RotateCw, Scale, Scissors, ShieldAlert, Shirt, ShoppingBag,
  ShoppingBasket, Shuffle, Smartphone, Store, Sun, Tag, Tent, Timer, TrainFront, Trees, Trophy, UserPlus, Users, Utensils,
  VenetianMask, Vote, Waves,
  type LucideIcon,
} from 'lucide-react';
import type { StepIcon } from '../data/seedEvents';

const ICONS: Record<StepIcon, LucideIcon> = {
  tag: Tag, users: Users, talk: MessagesSquare, phone: Smartphone, cards: Layers, heart: Heart, 'sign-up': UserPlus, shuffle: Shuffle,
  coffee: Coffee, pin: MapPin, walk: Footprints, door: DoorOpen, dice: Dices, chef: ChefHat, plate: Utensils, mic: Mic,
  handshake: Handshake, pitch: Presentation, hand: Hand, chart: ChartLine, warning: ShieldAlert, question: CircleHelp,
  briefcase: Briefcase, spin: RotateCw, timer: Timer, trophy: Trophy, mask: VenetianMask, moon: Moon, repeat: Repeat, crown: Crown,
  book: BookOpen, songs: ListMusic, sun: Sun, idea: Lightbulb, camera: Camera, flame: Flame, drop: Droplet, gift: Gift, pen: PenLine,
  brush: Paintbrush, bag: ShoppingBag, scissors: Scissors, stretch: PersonStanding, drama: Drama, clapper: Clapperboard,
  popcorn: Popcorn, vote: Vote, list: ClipboardList, shirt: Shirt, rail: Store, pencil: Pencil, eye: Eye, guitar: Guitar,
  music: Music, basket: ShoppingBasket, printer: Printer, data: Database, laptop: Laptop, code: Code, scale: Scale,
  languages: Languages, train: TrainFront, trees: Trees, buoy: LifeBuoy, waves: Waves, tent: Tent, car: Car, award: Award,
  film: Film, calendar: CalendarCheck, puzzle: Puzzle,
};

/** The page background runs purple (top) to blue (bottom); the steps run the other way. */
const TOP = 'rgb(88,118,224)';
const BOTTOM = 'rgb(133,96,216)';

/** Small doodles around the drawing; each step gets a different pair so they don't repeat. */
const ACCENTS = [
  <path key="spark" d="M52 6l1.6 4.2 4.2 1.6-4.2 1.6-1.6 4.2-1.6-4.2-4.2-1.6 4.2-1.6z" />,
  <circle key="dot" cx="10" cy="53" r="2.6" />,
  <path key="squiggle" d="M47 55c2-2.5 4-2.5 6 0s4 2.5 6 0" />,
  <path key="plus" d="M9 9v7M5.5 12.5h7" />,
];

/**
 * A "How it works" drawing: the step's outline icon inside a loose dashed ring, with two small
 * doodles, all stroked in the reverse of the background gradient. Decorative; the step's title
 * carries the meaning.
 */
export const StepArt = ({ icon, index = 0, size = 64 }: { icon: StepIcon; index?: number; size?: number }) => {
  const id = useId().replace(/:/g, '');
  const Icon = ICONS[icon] ?? Lightbulb;
  const accents = [ACCENTS[index % 4], ACCENTS[(index + 2) % 4]];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id={`${id}-o`} x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={TOP} />
          <stop offset="1" stopColor={BOTTOM} />
        </linearGradient>
        <linearGradient id={`${id}-i`} x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={TOP} />
          <stop offset="1" stopColor={BOTTOM} />
        </linearGradient>
      </defs>
      <g stroke={`url(#${id}-o)`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="32" cy="32" r="25" strokeDasharray="2 5.5" transform={`rotate(${index * 37} 32 32)`} />
        {accents}
      </g>
      <Icon x={17} y={17} width={30} height={30} stroke={`url(#${id}-i)`} strokeWidth={1.8} />
    </svg>
  );
};
