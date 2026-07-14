export function toggleAccordionValue(currentValue: string | string[] | null, nextValue: string) {
  if (!currentValue) {
    return [nextValue];
  }

  if (Array.isArray(currentValue)) {
    return currentValue.includes(nextValue)
      ? currentValue.filter((value) => value !== nextValue)
      : [...currentValue, nextValue];
  }

  return currentValue === nextValue ? [] : [currentValue, nextValue];
}
