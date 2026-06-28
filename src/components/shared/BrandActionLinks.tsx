import { Plus, Minus } from 'lucide-react';

export interface BrandWithActionLinks {
  id: string;
  name: string;
  link?: string | null;
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

interface BrandActionLinksProps {
  brand: BrandWithActionLinks;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function getBrandActionLinks(brand: BrandWithActionLinks) {
  return [
    {
      text: brand.action_link_1_text,
      url: brand.action_link_1_url,
      newTab: brand.action_link_1_new_tab,
      enabled: brand.action_link_1_enabled,
    },
    {
      text: brand.action_link_2_text,
      url: brand.action_link_2_url,
      newTab: brand.action_link_2_new_tab,
      enabled: brand.action_link_2_enabled,
    },
    {
      text: brand.action_link_3_text,
      url: brand.action_link_3_url,
      newTab: brand.action_link_3_new_tab,
      enabled: brand.action_link_3_enabled,
    },
  ].filter((link) => link.enabled && link.text?.trim() && link.url?.trim());
}

export default function BrandActionLinks({ brand, isExpanded = false, onToggle }: BrandActionLinksProps) {
  const actionLinks = getBrandActionLinks(brand);
  const hasActionLinks = actionLinks.length > 0;
  const isExpandable = hasActionLinks && typeof onToggle === 'function';

  return (
    <div className="border-b border-border/30 last:border-0 pb-3 pt-1">
      <div className="flex items-center justify-between gap-1 py-1 text-left">
        <div className="min-w-0">
          {brand.link ? (
            <a
              href={brand.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full truncate text-sm md:text-base font-medium text-foreground hover:text-primary transition-colors"
            >
              {brand.name}
            </a>
          ) : (
            <div className="block w-full text-sm md:text-base font-medium text-muted-foreground">
              {brand.name}
            </div>
          )}
        </div>

        {isExpandable && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggle?.();
            }}
            className="inline-flex h-8 w-8 items-center justify-center bg-transparent text-muted-foreground transition-colors hover:text-primary"
            aria-label={isExpanded ? 'Collapse action links' : 'Expand action links'}
          >
            {isExpanded ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {hasActionLinks && isExpanded && (
        <div className="mt-2 space-y-2 border-l-2 border-[#2b7bcc] pl-4 ml-1">
          {actionLinks.map((link) => (
            <a
              key={`${brand.id}-${link.url}`}
              href={link.url}
              target={link.newTab ? '_blank' : undefined}
              rel={link.newTab ? 'noopener noreferrer' : undefined}
              className="block border-b border-border/50 bg-card px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
            >
              {link.text}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
