import React, { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Apple, Asterisk, Backpack, Beer, Bike, Bird, BookOpen, Bus, Cake, Camera, Carrot, Cat, Cherry, Circle, Clapperboard, Cloud,
  CloudRain, CloudSun, Coffee, Compass, Cookie, Croissant, Crown, CupSoda, Diamond, Dices, Disc3, Dog, Drama, Drum, Dumbbell, Fish,
  Flower2, Footprints, Gamepad2, Glasses, Globe, Goal, Grape, Guitar, Headphones, Heart, Hexagon, IceCreamCone, Joystick, Kayak,
  Leaf, Lightbulb, Luggage, Map as MapIcon, MapPin, Medal, Mic, Moon, Mountain, MountainSnow, Music, Music2, Paintbrush, Palette, Piano, Pizza,
  Plane, Plus, Popcorn, Puzzle, Radio, Rainbow, Rocket, Sailboat, Salad, Sandwich, Scissors, Ship, Shirt, Snowflake, Soup, Spade,
  Sparkle, Sprout, Star, Sun, Telescope, Tent, TentTree, Ticket, TrainFront, TreePalm, Triangle, Trophy, Umbrella, Volleyball, Waves,
  Wind, Wine,
} from 'lucide-react';

/** About sixty outline drawings: sports, music, food, travel, games, weather, hobbies. */
const DRAWINGS: LucideIcon[] = [
  Bike, Dumbbell, Trophy, Volleyball, Medal, Goal, Footprints, Mountain, MountainSnow, Waves, Sailboat, Kayak, Tent, TentTree,
  Music, Music2, Guitar, Headphones, Mic, Piano, Drum, Radio, Disc3,
  Pizza, Coffee, CupSoda, IceCreamCone, Cookie, Croissant, Apple, Cherry, Sandwich, Soup, Beer, Wine, Popcorn, Cake, Salad, Carrot, Grape,
  Plane, MapIcon, MapPin, Compass, Luggage, Ticket, TrainFront, Bus, Ship, Globe, TreePalm, Backpack,
  Gamepad2, Dices, Puzzle, Spade, Crown, Joystick,
  Sun, Cloud, CloudRain, CloudSun, Snowflake, Umbrella, Moon, Rainbow, Wind,
  Palette, Paintbrush, Scissors, BookOpen, Camera, Flower2, Sprout, Leaf, Clapperboard, Drama, Telescope, Fish, Bird, Cat, Dog,
  Rocket, Lightbulb, Shirt, Glasses,
];

/** Tiny filler shapes between the drawings. */
const FILLERS: LucideIcon[] = [Circle, Star, Sparkle, Plus, Triangle, Diamond, Asterisk, Hexagon, Heart];

interface Placed {
  Icon: LucideIcon;
  x: number;
  y: number;
  size: number;
  rotate: number;
  colour: string;
}

const GAP = 12;
const TOP = [133, 96, 216]; // purple at the top
const BOTTOM = [88, 118, 224]; // blue at the bottom

/** Small deterministic random generator, so a given size always gets the same layout. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<string, Placed[]>();

/** An even scatter with no overlaps (12px apart), sizes 30–84px plus ~22% fillers of 16–26px. */
function layout(width: number, height: number): Placed[] {
  const key = `${width}x${height}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rand = mulberry32(width * 7919 + height);
  const cell = 140;
  const grid = new Map<string, Placed[]>();
  const placed: Placed[] = [];
  const radius = (size: number) => size * 0.72 + GAP / 2; // a rotated square's half-diagonal, plus half the gap
  let misses = 0;
  let drawing = Math.floor(rand() * DRAWINGS.length);

  while (misses < 900 && placed.length < 600) {
    const filler = rand() < 0.22;
    const size = filler ? 16 + rand() * 10 : 30 + rand() * 54;
    const r = radius(size);
    const x = size / 2 + rand() * (width - size);
    const y = size / 2 + rand() * (height - size);
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    let clash = false;
    for (let gx = cx - 1; gx <= cx + 1 && !clash; gx++) {
      for (let gy = cy - 1; gy <= cy + 1 && !clash; gy++) {
        for (const p of grid.get(`${gx},${gy}`) ?? []) {
          if (Math.hypot(p.x - x, p.y - y) < r + radius(p.size)) {
            clash = true;
            break;
          }
        }
      }
    }
    if (clash) {
      misses++;
      continue;
    }
    misses = 0;
    const t = Math.min(1, Math.max(0, y / height));
    const colour = `rgb(${TOP.map((c, i) => Math.round(c + (BOTTOM[i] - c) * t)).join(',')})`;
    // Walk through the drawings so neighbours differ; fillers are picked at random.
    const Icon = filler ? FILLERS[Math.floor(rand() * FILLERS.length)] : DRAWINGS[(drawing += 1 + Math.floor(rand() * 7)) % DRAWINGS.length];
    const p = { Icon, x, y, size: Math.round(size), rotate: Math.round(-25 + rand() * 50), colour };
    placed.push(p);
    const k = `${cx},${cy}`;
    grid.set(k, [...(grid.get(k) ?? []), p]);
  }
  cache.set(key, placed);
  return placed;
}

/** Rounded up, so the browser bar sliding on a phone doesn't reshuffle the drawings. */
const bucket = (h: number) => Math.ceil(h / 160) * 160;

/** "Background 1 · Even scatter": outline drawings behind everything, fixed while the page scrolls. */
export const DoodleBackground = () => {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: bucket(window.innerHeight) }));
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setSize({ w: window.innerWidth, h: bucket(window.innerHeight) }), 150);
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, []);
  const items = useMemo(() => layout(size.w, size.h), [size.w, size.h]);

  return (
    <div aria-hidden="true" className="doodle-layer pointer-events-none fixed inset-x-0 top-0 -z-[1] overflow-hidden" style={{ height: size.h, opacity: 0.9 }}>
      {items.map(({ Icon, x, y, size: s, rotate, colour }, i) => (
        <Icon
          key={i}
          size={s}
          strokeWidth={1.8}
          absoluteStrokeWidth
          color={colour}
          style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, transform: `rotate(${rotate}deg)` }}
        />
      ))}
    </div>
  );
};
