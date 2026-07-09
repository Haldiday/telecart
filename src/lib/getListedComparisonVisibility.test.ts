import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  GET_LISTED_COMPARISON_VISIBILITY_STORAGE_KEY,
  getComparisonPlanVisibilityMap,
  setComparisonPlanVisibility,
  isComparisonPlanVisible,
  getVisibleComparisonPlans,
} from './getListedComparisonVisibility';

describe('getListed comparison plan visibility helpers', () => {
  const clearStorage = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  };

  beforeEach(() => {
    clearStorage();
  });

  afterEach(() => {
    clearStorage();
  });

  it('defaults to visible when no persisted value exists', () => {
    expect(isComparisonPlanVisible('plan-1')).toBe(true);
    expect(getVisibleComparisonPlans([{ id: 'plan-1' }, { id: 'plan-2' }])).toHaveLength(2);
  });

  it('persists and reads per-plan visibility independently', () => {
    setComparisonPlanVisibility('plan-1', false);
    setComparisonPlanVisibility('plan-2', true);

    expect(getComparisonPlanVisibilityMap()).toEqual({
      'plan-1': false,
      'plan-2': true,
    });
    expect(isComparisonPlanVisible('plan-1')).toBe(false);
    expect(isComparisonPlanVisible('plan-2')).toBe(true);
    expect(getVisibleComparisonPlans([{ id: 'plan-1' }, { id: 'plan-2' }, { id: 'plan-3' }])).toEqual([
      { id: 'plan-2' },
      { id: 'plan-3' },
    ]);
  });

  it('uses the storage key expected by the UI', () => {
    expect(GET_LISTED_COMPARISON_VISIBILITY_STORAGE_KEY).toBe('getListedComparisonPlanVisibility');
  });
});
