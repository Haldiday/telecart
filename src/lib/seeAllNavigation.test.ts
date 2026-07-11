import { describe, expect, it } from 'vitest';
import { getSeeAllBackPath } from './seeAllNavigation';

describe('getSeeAllBackPath', () => {
  it('returns a home route with section hash when a section id is available', () => {
    expect(getSeeAllBackPath('123')).toBe('/#section-123');
  });

  it('preserves an existing section prefix when a section id is already formatted', () => {
    expect(getSeeAllBackPath('section-123')).toBe('/#section-123');
  });

  it('falls back to the home route when no section id is available', () => {
    expect(getSeeAllBackPath()).toBe('/');
  });
});
