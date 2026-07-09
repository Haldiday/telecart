export const GET_LISTED_COMPARISON_VISIBILITY_STORAGE_KEY = 'getListedComparisonPlanVisibility';

export type ComparisonPlanVisibilityMap = Record<string, boolean>;

let inMemoryVisibilityMap: ComparisonPlanVisibilityMap = {};

const readVisibilityMap = (): ComparisonPlanVisibilityMap => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return inMemoryVisibilityMap;
  }

  try {
    const rawValue = window.localStorage.getItem(GET_LISTED_COMPARISON_VISIBILITY_STORAGE_KEY);
    if (!rawValue) {
      return inMemoryVisibilityMap;
    }

    const parsed = JSON.parse(rawValue) as ComparisonPlanVisibilityMap;
    const normalizedMap = parsed && typeof parsed === 'object' ? parsed : {};
    inMemoryVisibilityMap = normalizedMap;
    return normalizedMap;
  } catch {
    return inMemoryVisibilityMap;
  }
};

const writeVisibilityMap = (map: ComparisonPlanVisibilityMap) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    inMemoryVisibilityMap = map;
    return;
  }

  window.localStorage.setItem(GET_LISTED_COMPARISON_VISIBILITY_STORAGE_KEY, JSON.stringify(map));
  inMemoryVisibilityMap = map;
};

export const getComparisonPlanVisibilityMap = (): ComparisonPlanVisibilityMap => readVisibilityMap();

export const setComparisonPlanVisibility = (planId: string, visible: boolean) => {
  const nextMap = { ...readVisibilityMap(), [planId]: visible };
  writeVisibilityMap(nextMap);
  return nextMap;
};

export const isComparisonPlanVisible = (planId: string): boolean => {
  const map = readVisibilityMap();
  return map[planId] ?? true;
};

export const getVisibleComparisonPlans = <T extends { id: string }>(plans: T[]) => {
  return plans.filter((plan) => isComparisonPlanVisible(plan.id));
};
