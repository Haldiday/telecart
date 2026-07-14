import { describe, expect, it } from 'vitest';
import { buildHierarchicalSearchResults } from './searchHierarchy';

describe('buildHierarchicalSearchResults', () => {
<<<<<<< HEAD
  it('returns hierarchical results for matching categories, subcategories, brands, and sections', () => {
    const results = buildHierarchicalSearchResults({
      query: 'footwear',
      categories: [{ id: 'cat-1', name: 'Footwear' }],
      subcategories: [{
        id: 'sub-1',
        category_id: 'cat-1',
        name: 'Running Shoes',
        custom_link: null,
        custom_link_type: null,
        subcategory_brands: [{ id: 'brand-1', name: 'Nike', link: 'https://example.com' }],
      }],
      brands: [{
        id: 'brand-1',
        name: 'Nike',
        subcategory_id: 'sub-1',
        link: 'https://example.com',
        subcategories: { id: 'sub-1', name: 'Running Shoes', category_id: 'cat-1' },
        action_links: [],
        action_link_1_text: null,
        action_link_1_url: null,
        action_link_1_new_tab: false,
        action_link_1_enabled: false,
        action_link_2_text: null,
        action_link_2_url: null,
        action_link_2_new_tab: false,
        action_link_2_enabled: false,
        action_link_3_text: null,
        action_link_3_url: null,
        action_link_3_new_tab: false,
        action_link_3_enabled: false,
      }],
      sections: [{ id: 'section-1', heading: 'Best Shoes', name: 'Shoes Offers' }],
    });

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'category', name: 'Footwear' }),
        expect.objectContaining({ type: 'subcategory', name: 'Running Shoes', categoryId: 'cat-1' }),
        expect.objectContaining({ type: 'brand', name: 'Nike', subcategoryId: 'sub-1', subcategoryName: 'Running Shoes' }),
        expect.objectContaining({ type: 'section', name: expect.any(String) }),
      ])
    );
=======
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
>>>>>>> a30613a28d5280ea07e0b3f8552f0c12c06b833d
  });
});
