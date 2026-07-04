import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BrandActionLinks, { getBrandActionLinks, type BrandWithActionLinks } from './BrandActionLinks';

const baseBrand: BrandWithActionLinks = {
  id: 'brand-1',
  name: 'Test Brand',
};

describe('getBrandActionLinks', () => {
  it('returns a text-only action link when only text is provided', () => {
    const links = getBrandActionLinks({
      ...baseBrand,
      action_link_1_text: 'Contact us',
      action_link_1_enabled: true,
    });

    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      text: 'Contact us',
      url: undefined,
      isClickable: false,
    });
  });

  it('returns a clickable link when both text and url are provided', () => {
    const links = getBrandActionLinks({
      ...baseBrand,
      action_link_1_text: 'Apply now',
      action_link_1_url: 'https://example.com/apply',
      action_link_1_enabled: true,
    });

    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      text: 'Apply now',
      url: 'https://example.com/apply',
      isClickable: true,
    });
  });

  it('returns action links from the action_links array when provided', () => {
    const links = getBrandActionLinks({
      ...baseBrand,
      action_links: [
        { text: 'Contact us', url: 'https://example.com/contact', enabled: true, new_tab: true },
        { text: 'Learn more', enabled: true },
      ],
    });

    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({
      text: 'Contact us',
      url: 'https://example.com/contact',
      isClickable: true,
    });
    expect(links[1]).toMatchObject({
      text: 'Learn more',
      url: undefined,
      isClickable: false,
    });
  });

  it('renders plain text when only text is provided', () => {
    render(
      <BrandActionLinks
        brand={{
          ...baseBrand,
          action_link_1_text: 'Contact us',
          action_link_1_enabled: true,
        }}
        isExpanded
      />
    );

    expect(screen.getByText('Contact us')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contact us' })).not.toBeInTheDocument();
  });
});
