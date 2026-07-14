import { describe, expect, it } from 'vitest';
import { toggleAccordionValue } from './faqAccordion.ts';

describe('toggleAccordionValue', () => {
  it('adds a value when it is not already open', () => {
    expect(toggleAccordionValue(['one'], 'two')).toEqual(['one', 'two']);
  });

  it('removes a value when it is already open', () => {
    expect(toggleAccordionValue(['one', 'two'], 'two')).toEqual(['one']);
  });
});
