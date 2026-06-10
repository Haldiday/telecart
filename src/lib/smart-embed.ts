export type EmbedCheckStatus = 'allowed' | 'blocked' | 'unknown';

export interface EmbedCheckResult {
  status: EmbedCheckStatus;
  reason?: string;
  embedUrl: string;
  finalUrl?: string;
  shouldAutoRedirect?: boolean;
}

const BLOCKED_PROTOCOLS = ['mailto:', 'tel:', 'sms:', 'javascript:', 'data:', '#'];

export const isBlockedLinkProtocol = (href: string) => {
  const normalized = href.trim().toLowerCase();
  return BLOCKED_PROTOCOLS.some((protocol) => normalized.startsWith(protocol));
};

export const normalizeExternalUrl = (value: string | URL | null | undefined): string | null => {
  if (!value) return null;

  const rawValue = value.toString().trim();
  if (!rawValue || isBlockedLinkProtocol(rawValue)) return null;

  try {
    const url = new URL(rawValue, window.location.origin);
    if (url.origin !== window.location.origin) return url.toString();
  } catch {
    return null;
  }

  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(rawValue)) {
    try {
      return new URL(`https://${rawValue}`).toString();
    } catch {
      return null;
    }
  }

  if (rawValue.startsWith('//')) {
    try {
      return new URL(`${window.location.protocol}${rawValue}`).toString();
    } catch {
      return null;
    }
  }

  return null;
};

export const getEmbedViewerUrl = (targetUrl: string, options?: { autoRedirect?: boolean }) => {
  const params = new URLSearchParams({ url: targetUrl });
  if (options?.autoRedirect) params.set('redirect', '1');
  return `/embed?${params.toString()}`;
};

export const getSmartNavigationUrl = (targetUrl: string) => {
  const externalUrl = normalizeExternalUrl(targetUrl);
  return externalUrl ? getEmbedViewerUrl(externalUrl) : targetUrl;
};

export const getSmartEmbedUrl = (targetUrl: string) => {
  try {
    const url = new URL(targetUrl);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');

    if (host === 'youtu.be') {
      const videoId = url.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : targetUrl;
    }

    if (host.endsWith('youtube.com')) {
      const videoId =
        url.searchParams.get('v') ||
        url.pathname.match(/\/(?:shorts|live|embed)\/([^/?#]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : targetUrl;
    }

    if (host.endsWith('vimeo.com')) {
      const videoId = url.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : targetUrl;
    }

    if (host === 'forms.gle') return targetUrl;

    if (host === 'docs.google.com' && url.pathname.includes('/forms/')) {
      url.searchParams.set('embedded', 'true');
      return url.toString();
    }

    if (host.endsWith('airtable.com') && !url.pathname.startsWith('/embed/')) {
      url.pathname = `/embed${url.pathname}`;
      return url.toString();
    }

    if (host.endsWith('calendly.com')) {
      url.searchParams.set('embed_domain', window.location.hostname);
      url.searchParams.set('embed_type', 'Inline');
      return url.toString();
    }

    if (host.endsWith('jotform.com') && url.pathname.includes('/form/')) {
      return url.toString();
    }

    if (host.endsWith('typeform.com') || host.endsWith('form.typeform.com')) {
      return url.toString();
    }

    if (host.includes('zohopublic.')) {
      return url.toString();
    }

    if (url.pathname.toLowerCase().endsWith('.pdf')) {
      return url.toString();
    }

    return targetUrl;
  } catch {
    return targetUrl;
  }
};

export const checkEmbedSupport = async (targetUrl: string, signal?: AbortSignal): Promise<EmbedCheckResult> => {
  const embedUrl = getSmartEmbedUrl(targetUrl);

  try {
    const response = await fetch(`/.netlify/functions/embed-check?url=${encodeURIComponent(embedUrl)}`, {
      signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return { status: 'unknown', embedUrl, reason: 'Header check unavailable' };
    }

    const data = (await response.json()) as EmbedCheckResult;
    return {
      status: data.status || 'unknown',
      reason: data.reason,
      embedUrl: data.embedUrl || embedUrl,
      finalUrl: data.finalUrl,
      shouldAutoRedirect: Boolean(data.shouldAutoRedirect),
    };
  } catch {
    return { status: 'unknown', embedUrl, reason: 'Header check unavailable' };
  }
};
