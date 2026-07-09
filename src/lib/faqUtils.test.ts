import { describe, expect, it } from 'vitest';
import { buildFaqTree, type FAQRecord } from './faqUtils';

const baseFaq = (overrides: Partial<FAQRecord> = {}): FAQRecord => ({
  id: 'faq-1',
  parent_id: null,
  question: 'Main question',
  answer: null,
  sort_order: 0,
  is_visible: true,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

describe('buildFaqTree', () => {
  it('groups children under their parent and sorts each level by sort order', () => {
    const faqs: FAQRecord[] = [
      baseFaq({ id: 'main-1', question: 'Main 1', sort_order: 1 }),
      baseFaq({ id: 'sub-1', parent_id: 'main-1', question: 'Sub 1', sort_order: 2 }),
      baseFaq({ id: 'sub-2', parent_id: 'main-1', question: 'Sub 2', sort_order: 1 }),
      baseFaq({ id: 'main-2', question: 'Main 2', sort_order: 0 }),
    ];

    const tree = buildFaqTree(faqs);

    expect(tree.map((item) => item.question)).toEqual(['Main 2', 'Main 1']);
    expect(tree[1].children.map((child) => child.question)).toEqual(['Sub 2', 'Sub 1']);
  });

  it('includes hidden records when requested', () => {
    const faqs: FAQRecord[] = [
      baseFaq({ id: 'main-1', question: 'Main', is_visible: false }),
      baseFaq({ id: 'sub-1', parent_id: 'main-1', question: 'Sub', sort_order: 0 }),
    ];

    const tree = buildFaqTree(faqs, { includeHidden: true });

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
  });

  it('treats legacy flat records without parent_id as top-level items', () => {
    const faqs: FAQRecord[] = [
      baseFaq({ id: 'faq-1', question: 'Legacy 1' }),
      baseFaq({ id: 'faq-2', question: 'Legacy 2' }),
    ];

    const tree = buildFaqTree(faqs);

    expect(tree).toHaveLength(2);
    expect(tree.every((item) => item.children.length === 0)).toBe(true);
  });
});
