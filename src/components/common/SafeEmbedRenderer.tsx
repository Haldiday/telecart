import React, { useMemo } from 'react';

interface SafeEmbedRendererProps {
  content: string;
  type: 'link' | 'iframe' | 'embed_code';
  className?: string;
}

const TRUSTED_DOMAINS = [
  'forms.zohopublic.in',
  'zohopublic.in',
  'docs.google.com/forms',
  'forms.gle',
  'tally.so',
  'typeform.com'
];

export const SafeEmbedRenderer: React.FC<SafeEmbedRendererProps> = ({ content, type, className }) => {
  const embedUrl = useMemo(() => {
    if (!content) return null;

    // If it's a simple link, we don't render it here (usually handled by parent)
    if (type === 'link' && (content.startsWith('http://') || content.startsWith('https://'))) {
      return null;
    }

    // Try to extract URL from iframe src
    const iframeSrcMatch = content.match(/src=["']([^"']+)["']/);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      const url = iframeSrcMatch[1];
      if (TRUSTED_DOMAINS.some(domain => url.includes(domain))) {
        return url;
      }
    }

    // Try to extract URL from Zoho script
    if (content.includes('zohopublic.in')) {
      // Improved regex to handle spaces, backticks and different quote types
      const zohoUrlMatch = content.match(/ifrmSrc\s*=\s*['"]\s*`?([^`'"]+)`?\s*['"]/);
      if (zohoUrlMatch && zohoUrlMatch[1]) {
        const url = zohoUrlMatch[1].trim();
        if (TRUSTED_DOMAINS.some(domain => url.includes(domain))) {
          return url;
        }
      }
    }

    // If it's already a URL but marked as iframe/embed
    if (content.startsWith('http://') || content.startsWith('https://')) {
      if (TRUSTED_DOMAINS.some(domain => content.includes(domain))) {
        return content;
      }
    }

    return null;
  }, [content, type]);

  if (!embedUrl) {
    if (type === 'link') return null;
    return (
      <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-lg text-sm">
        Unsupported or untrusted embed code. Please use a trusted provider.
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm ${className}`}>
      <iframe
        src={embedUrl}
        className="w-full min-h-[600px] border-none"
        title="Embedded Content"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        loading="lazy"
      />
    </div>
  );
};
