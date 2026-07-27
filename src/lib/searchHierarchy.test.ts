import { describe, expect, it } from 'vitest';
import { buildHierarchicalSearchResults } from './searchHierarchy';

describe('buildHierarchicalSearchResults', () => {
  it('returns category results before their subcategory descendants for category searches', () => {
    const results = buildHierarchicalSearchResults({
      query: 'Data Connectivity',
      categories: [{ id: 'cat-1', name: 'Data Connectivity' }],
      subcategories: [
        {
          id: 'sub-1',
          category_id: 'cat-1',
          name: 'VPN',
          custom_link: null,
          custom_link_type: 'link',
        },
      ],
      brands: [],
    });

    expect(results.map((result) => `${result.type}:${result.name}`)).toEqual([
      'category:Data Connectivity',
      'subcategory:Data Connectivity (VPN)',
    ]);
  });

  it('returns brand results and their action links for brand searches', () => {
    const results = buildHierarchicalSearchResults({
      query: 'Cisco',
      categories: [],
      subcategories: [],
      brands: [
        {
          id: 'brand-1',
          name: 'Cisco',
          subcategory_id: 'sub-1',
          link: null,
          subcategories: {
            id: 'sub-1',
            name: 'VPN',
            category_id: 'cat-1',
            custom_link: null,
            custom_link_type: 'link',
          },
          action_links: [
            { text: 'Contact Sales', url: 'https://example.com/contact', enabled: true },
          ],
        },
      ],
    });

    expect(results.map((result) => `${result.type}:${result.name}`)).toEqual([
      'brand:Cisco',
      'brand_action_link:Cisco (Contact Sales)',
    ]);
  });
});
