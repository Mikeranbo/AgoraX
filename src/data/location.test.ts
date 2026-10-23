import { describe, expect, it } from 'vitest';
import { cityOf, distanceKm, locationMatch, nearestCity } from './location';

describe('cityOf', () => {
  it('uses the event city, or the pilot city when there is none', () => {
    expect(cityOf({ city: 'Assen' })).toBe('Assen');
    expect(cityOf({})).toBe('Groningen');
    expect(cityOf({ city: '  ' })).toBe('Groningen');
  });
});

describe('locationMatch', () => {
  it('treats the same city as near, whatever the case', () => {
    expect(locationMatch('groningen', 'Groningen')).toBe('near');
  });

  it('uses the 40 km radius between listed cities', () => {
    expect(locationMatch('Assen', 'Groningen')).toBe('near'); // ~25 km
    expect(locationMatch('Leeuwarden', 'Groningen')).toBe('far'); // ~51 km
    expect(locationMatch('Amsterdam', 'Groningen')).toBe('far');
  });

  it('calls an unlisted place unknown instead of guessing', () => {
    expect(locationMatch('Schiermonnikoog', 'Groningen')).toBe('unknown');
    expect(locationMatch('Groningen', 'Somewhere')).toBe('unknown');
    expect(locationMatch('Somewhere', 'Somewhere')).toBe('near');
  });
});

describe('nearestCity', () => {
  it('matches a position to the closest listed city', () => {
    expect(nearestCity(53.24, 6.53)).toBe('Groningen'); // Zernike campus
    expect(nearestCity(52.37, 4.89)).toBe('Amsterdam');
  });

  it('matches nothing far away from every listed city', () => {
    expect(nearestCity(48.85, 2.35)).toBeNull(); // Paris
  });

  it('measures distances in kilometres', () => {
    expect(Math.round(distanceKm({ lat: 53.2194, lng: 6.5665 }, { lat: 52.9925, lng: 6.5649 }))).toBe(25);
  });
});
