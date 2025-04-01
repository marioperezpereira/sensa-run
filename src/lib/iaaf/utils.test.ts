import { describe, it, expect } from 'vitest';
import { getIAAFPoints } from './utils';
import { RaceResult } from '@/components/personal-bests/race-results/types';

describe('getIAAFPoints', () => {
  it('should return 0 for null result', () => {
    expect(getIAAFPoints(null, 'men')).toBe(0);
  });

  it('should calculate points for a valid outdoor result', () => {
    const result: RaceResult = {
      id: '1',
      race_date: '2024-03-20',
      distance: '100m',
      hours: 0,
      minutes: 0,
      seconds: 10.0,
      surface_type: 'Pista de atletismo',
      track_type: 'Aire Libre'
    };

    const points = getIAAFPoints(result, 'men');
    expect(points).toBeGreaterThan(0);
  });

  it('should calculate points for a valid indoor result', () => {
    const result: RaceResult = {
      id: '1',
      race_date: '2024-03-20',
      distance: '60m',
      hours: 0,
      minutes: 0,
      seconds: 6.5,
      surface_type: 'Pista de atletismo',
      track_type: 'Pista Cubierta'
    };

    const points = getIAAFPoints(result, 'men');
    expect(points).toBeGreaterThan(0);
  });

  it('should handle errors gracefully', () => {
    const invalidResult: RaceResult = {
      id: '1',
      race_date: '2024-03-20',
      distance: 'invalid',
      hours: 0,
      minutes: 0,
      seconds: 0,
      surface_type: 'Pista de atletismo',
      track_type: 'Aire Libre'
    };

    expect(getIAAFPoints(invalidResult, 'men')).toBe(0);
  });
}); 