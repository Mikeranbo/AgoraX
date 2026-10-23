import { PILOT_CITY } from '../config/pilot';
import type { Event } from '../types';

/** Cities someone can pick, with their centre point (degrees). Only used to compare distances. */
export const CITIES = [
  { name: 'Groningen', lat: 53.2194, lng: 6.5665 },
  { name: 'Leeuwarden', lat: 53.2012, lng: 5.7999 },
  { name: 'Assen', lat: 52.9925, lng: 6.5649 },
  { name: 'Drachten', lat: 53.1065, lng: 6.0991 },
  { name: 'Emmen', lat: 52.7792, lng: 6.9063 },
  { name: 'Zwolle', lat: 52.5168, lng: 6.083 },
  { name: 'Enschede', lat: 52.2215, lng: 6.8937 },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { name: 'Utrecht', lat: 52.0907, lng: 5.1214 },
  { name: 'The Hague', lat: 52.0705, lng: 4.3007 },
  { name: 'Rotterdam', lat: 51.9244, lng: 4.4777 },
  { name: 'Nijmegen', lat: 51.8126, lng: 5.8372 },
  { name: 'Eindhoven', lat: 51.4416, lng: 5.4697 },
] as const;

/** "Near" = the same city, or a listed city whose centre is at most this far away. */
export const NEAR_KM = 40;

/** A located device further than this from every listed city is not matched to any of them. */
const MATCH_KM = 60;

const find = (name: string) => CITIES.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());

/** Straight-line distance between two points, in km (haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Where an event is organised: its own city, or the pilot city for proposals without one. */
export function cityOf(e: Pick<Event, 'city'>): string {
  return e.city?.trim() || PILOT_CITY;
}

export type LocationMatch = 'near' | 'far' | 'unknown';

/**
 * How an event relates to the chosen city. A city we have no coordinates for is 'unknown'
 * unless it is literally the chosen city, so it is never wrongly called near or far.
 */
export function locationMatch(eventCity: string, chosen: string): LocationMatch {
  if (eventCity.trim().toLowerCase() === chosen.trim().toLowerCase()) return 'near';
  const a = find(eventCity);
  const b = find(chosen);
  if (!a || !b) return 'unknown';
  return distanceKm(a, b) <= NEAR_KM ? 'near' : 'far';
}

/**
 * The listed city nearest to a position, or null when none is within reach. Callers pass the
 * browser's position and keep only the returned city name; the coordinates are not stored.
 */
export function nearestCity(lat: number, lng: number): string | null {
  let best: { name: string; km: number } | null = null;
  for (const c of CITIES) {
    const km = distanceKm({ lat, lng }, c);
    if (!best || km < best.km) best = { name: c.name, km };
  }
  return best && best.km <= MATCH_KM ? best.name : null;
}
