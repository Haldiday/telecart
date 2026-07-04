import { Plus, Minus } from 'lucide-react';

export interface BrandActionLinkItem {
  id?: string;
  text?: string | null;
  url?: string | null;
  new_tab?: boolean;
  enabled?: boolean;
}

export interface BrandWithActionLinks {
  id: string;
  name: string;
  link?: string | null;
  action_links?: BrandActionLinkItem[];
  action_link_1_text?: string | null;
  action_link_1_url?: string | null;
  action_link_1_new_tab?: boolean;
  action_link_1_enabled?: boolean;
  action_link_2_text?: string | null;
  action_link_2_url?: string | null;
  action_link_2_new_tab?: boolean;
  action_link_2_enabled?: boolean;
  action_link_3_text?: string | null;
  action_link_3_url?: string | null;
  action_link_3_new_tab?: boolean;
  action_link_3_enabled?: boolean;
}

export interface BrandActionLink {
  text?: string;
  url?: string;
  newTab?: boolean;
  enabled?: boolean;
  isClickable: boolean;
  isVisible: boolean;
}

interface BrandActionLinksProps {
  brand: BrandWithActionLinks;
  isExpanded?: boolean;
  onToggle?: () => void;
}

function normalizeActionLinkValue(value?: string | null) {
  return value?.trim() ?? '';
}

function normalizeBrandActionLinks(brand: BrandWithActionLinks): Array<{ text: string; url: string; newTab?: boolean; enabled?: boolean }> {
  const configuredLinks = Array.isArray(brand.action_links)
    ? brand.action_links
        .map((link) => ({
          text: normalizeActionLinkValue(link?.text),
          url: normalizeActionLinkValue(link?.url),
          newTab: Boolean(link?.new_tab),
          enabled: link?.enabled ?? true,
        }))
        .filter((link) => Boolean(link.text || link.url || link.enabled !== undefined))
    : [];

  if (configuredLinks.length > 0) {
    return configuredLinks;
  }

  return [
    {
      text: normalizeActionLinkValue(brand.action_link_1_text),
      url: normalizeActionLinkValue(brand.action_link_1_url),
      newTab: brand.action_link_1_new_tab,
      enabled: brand.action_link_1_enabled,
    },
    {
      text: normalizeActionLinkValue(brand.action_link_2_text),
      url: normalizeActionLinkValue(brand.action_link_2_url),
      newTab: brand.action_link_2_new_tab,
      enabled: brand.action_link_2_enabled,
    },
    {
      text: normalizeActionLinkValue(brand.action_link_3_text),
      url: normalizeActionLinkValue(brand.action_link_3_url),
      newTab: brand.action_link_3_new_tab,
      enabled: brand.action_link_3_enabled,
    },
  ].filter((link) => Boolean(link.text || link.url || link.enabled !== undefined));
}

export function getBrandActionLinks(brand: BrandWithActionLinks): BrandActionLink[] {
  return normalizeBrandActionLinks(brand).map((link) => {
    const text = normalizeActionLinkValue(link.text);
    const url = normalizeActionLinkValue(link.url);
    const isEnabled = link.enabled ?? true;
    const hasText = text.length > 0;
    const hasUrl = url.length > 0;
    const isVisible = isEnabled && hasText;
    const isClickable = isVisible && hasUrl;

    return {
      ...link,
      text: isVisible ? text : undefined,
      url: hasUrl ? url : undefined,
      isClickable,
      isVisible,
    };
  }).filter((link) => link.isVisible);
}

export default function BrandActionLinks({ brand, isExpanded = false, onToggle }: BrandActionLinksProps) {
  const actionLinks = getBrandActionLinks(brand);
  const hasActionLinks = actionLinks.length > 0;
  const isExpandable = hasActionLinks && typeof onToggle === 'function';
  const hasLinkOrActions = brand.link || hasActionLinks;

  return (
    <div className="border-b border-border/30 last:border-0">
      <div
        onClick={() => {
          if (isExpandable) {
            onToggle?.();
          } else if (brand.link) {
            window.open(brand.link, '_blank');
          }
        }}
        className={`flex items-center justify-between py-2 text-left text-sm md:text-base font-normal text-foreground ${hasLinkOrActions ? 'hover:text-primary cursor-pointer' : 'opacity-100'}`}
      >
        {brand.link && !hasActionLinks ? (
          <a
            href={brand.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {brand.name}
          </a>
        ) : (
          <span className={hasLinkOrActions ? '' : 'text-foreground'}>{brand.name}</span>
        )}
        {hasActionLinks && (
          isExpanded ? (
            <Minus className="h-3.5 w-3.5 text-muted-foreground mr-2" />
          ) : (
            <Plus className="h-3.5 w-3.5 text-muted-foreground mr-2" />
          )
        )}
      </div>

      {hasActionLinks && isExpanded && (
        <div className="pb-3 pt-1 space-y-2">
          <div className="space-y-2 border-l-2 border-[#2b7bcc] pl-4 ml-1">
            {actionLinks.map((link) => {
              if (link.isClickable) {
                return (
                  <a
                    key={`${brand.id}-${link.text}`}
                    href={link.url}
                    target={link.newTab ? '_blank' : undefined}
                    rel={link.newTab ? 'noopener noreferrer' : undefined}
                    className="block border-b border-border/50 bg-card px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                  >
                    {link.text}
                  </a>
                );
              }

              return (
                <div
                  key={`${brand.id}-${link.text}`}
                  className="border-b border-border/50 bg-card px-3 py-2 text-sm font-medium text-foreground"
                >
                  {link.text}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
