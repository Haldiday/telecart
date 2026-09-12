import { describe, expect, it } from 'vitest';
import { buildLinkSearchResults } from './adminLinkSearch.js';

describe('buildLinkSearchResults', () => {
  it('matches trimmed exact URLs and deduplicates identical hierarchy locations', () => {
    const results = buildLinkSearchResults(
      'https://www.techjockey.com/',
      [{ id: 'category-1', name: 'Category A' }],
      [{
        id: 'subcategory-1',
        category_id: 'category-1',
        name: 'Subcategory 1',
        link: null,
        custom_link: null,
        schedule_link: null,
        schedule_link_2: null,
        form_link: null,
        button_1_link: null,
        button_2_link: null,
        button_3_link: null,
      }],
      [{
        id: 'brand-1',
        subcategory_id: 'subcategory-1',
        name: 'Brand A',
        link: ' https://www.techjockey.com/ ',
        action_link_1_text: 'WhatsApp',
        action_link_1_url: 'https://www.techjockey.com/',
        action_link_2_text: null,
        action_link_2_url: null,
        action_link_3_text: null,
        action_link_3_url: null,
        action_links: [{ text: 'WhatsApp', url: 'https://www.techjockey.com/' }],
        primary_cta_link: null,
        join_network_link: null,
        buttons: [{ label: 'Apply', link: 'https://www.techjockey.com/' }],
      }],
      [],
    );

    expect(results).toHaveLength(3);
    expect(results.map((result) => result.source)).toEqual([
      'brand.link',
      'brand.action_link_1_url',
      'brand.buttons[0].link',
    ]);
    expect(results.map((result) => result.actionLinkName)).toEqual([null, 'WhatsApp', 'Apply']);
  });

  it('deduplicates subcategory and category-button matches at the same location', () => {
    const results = buildLinkSearchResults(
      'https://example.com',
      [{ id: 'category-1', name: 'Category A' }],
      [{
        id: 'subcategory-1',
        category_id: 'category-1',
        name: 'Subcategory 1',
        link: 'https://example.com',
        custom_link: null,
        schedule_link: null,
        schedule_link_2: null,
        form_link: null,
        button_1_link: null,
        button_2_link: null,
        button_3_link: null,
      }],
      [],
      [{ id: 'button-1', subcategory_id: 'subcategory-1', link: ' https://example.com ' }],
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      category: 'Category A',
      subcategory: 'Subcategory 1',
      brand: null,
      actionLinkName: null,
    });
  });

  it('includes the actual parent heading in each unique hierarchy path', () => {
    const results = buildLinkSearchResults(
      'https://example.com',
      [
        { id: 'category-1', name: 'Category A', section_id: 'section-1' },
        { id: 'category-2', name: 'Category A', section_id: 'section-2' },
      ],
      [
        {
          id: 'subcategory-1',
          category_id: 'category-1',
          name: 'Subcategory 1',
          link: 'https://example.com',
          custom_link: null,
          schedule_link: null,
          schedule_link_2: null,
          form_link: null,
          button_1_link: null,
          button_2_link: null,
          button_3_link: null,
        },
        {
          id: 'subcategory-2',
          category_id: 'category-2',
          name: 'Subcategory 1',
          link: 'https://example.com',
          custom_link: null,
          schedule_link: null,
          schedule_link_2: null,
          form_link: null,
          button_1_link: null,
          button_2_link: null,
          button_3_link: null,
        },
      ],
      [],
      [],
      [
        { id: 'section-1', heading: 'Connectivity & CPaaS' },
        { id: 'section-2', heading: 'Software' },
      ],
    );

    expect(results.map((result) => [result.heading, result.category, result.subcategory])).toEqual([
      ['Connectivity & CPaaS', 'Category A', 'Subcategory 1'],
      ['Software', 'Category A', 'Subcategory 1'],
    ]);
  });

  it('matches arbitrary external URLs with paths and query parameters', () => {
    const bizReqUrl = 'https://forms.bizreq.com/BizReq/form/NLD/formperma/xkRWYW24LGhuH3dgWiVCRjasPGIgtpVJ2BAne0QABYs?source=admin';
    const results = buildLinkSearchResults(
      bizReqUrl,
      [{ id: 'category-1', name: 'Data Connectivity', section_id: 'section-1' }],
      [{
        id: 'subcategory-1',
        category_id: 'category-1',
        name: 'National Long Distance (NLD)',
        link: null,
        custom_link: bizReqUrl,
        schedule_link: null,
        schedule_link_2: null,
        form_link: null,
        button_1_link: null,
        button_2_link: null,
        button_3_link: null,
      }],
      [],
      [],
      [{ id: 'section-1', heading: 'Connectivity & CPaaS' }],
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      url: bizReqUrl,
      heading: 'Connectivity & CPaaS',
      category: 'Data Connectivity',
      subcategory: 'National Long Distance (NLD)',
      brand: null,
      actionLinkName: null,
    });
  });
});