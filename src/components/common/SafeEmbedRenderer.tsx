import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkEmbedSupport, getSmartEmbedUrl, normalizeExternalUrl } from '@/lib/smart-embed';

interface SafeEmbedRendererProps {
  content: string;
  type: 'link' | 'iframe' | 'embed_code';
  className?: string;
}

type EmbedState = 'checking' | 'loading' | 'loaded' | 'blocked';

const LOAD_TIMEOUT_MS = 8000;

const extractEmbedUrl = (content: string, type: SafeEmbedRendererProps['type']) => {
  if (!content) return null;

  if (type === 'link') return normalizeExternalUrl(content);

  const iframeSrcMatch = content.match(/src=["']([^"']+)["']/);
  if (iframeSrcMatch?.[1]) return normalizeExternalUrl(iframeSrcMatch[1]);

  if (content.includes('zohopublic.')) {
    const zohoUrlMatch = content.match(/ifrmSrc\s*=\s*['"]\s*`?([^`'"]+)`?\s*['"]/);
    if (zohoUrlMatch?.[1]) return normalizeExternalUrl(zohoUrlMatch[1].trim());
  }

  return normalizeExternalUrl(content);
};

export const SafeEmbedRenderer: React.FC<SafeEmbedRendererProps> = ({ content, type, className }) => {
  const targetUrl = useMemo(() => extractEmbedUrl(content, type), [content, type]);
  const [embedUrl, setEmbedUrl] = useState<string | null>(targetUrl ? getSmartEmbedUrl(targetUrl) : null);
  const [state, setState] = useState<EmbedState>(targetUrl ? 'checking' : 'blocked');
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  useEffect(() => {
    if (!targetUrl) {
      setState('blocked');
      setFallbackReason('Unsupported or invalid embed URL.');
      return;
    }

    const controller = new AbortController();
    setState('checking');
    setFallbackReason(null);
    setEmbedUrl(getSmartEmbedUrl(targetUrl));

    checkEmbedSupport(targetUrl, controller.signal).then((result) => {
      if (controller.signal.aborted) return;

      setEmbedUrl(result.embedUrl);
      if (result.status === 'blocked') {
        setFallbackReason(result.reason || 'This website does not allow embedding.');
        setState('blocked');
        return;
      }

      setState('loading');
    });

    return () => controller.abort();
  }, [targetUrl]);

  useEffect(() => {
    if (state !== 'loading') return;

    const timer = window.setTimeout(() => {
      setFallbackReason('The embedded page did not load in time.');
      setState('blocked');
    }, LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [state]);

  if (!targetUrl) {
    if (type === 'link') return null;
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Unsupported or invalid embed URL.
      </div>
    );
  }

  if (state === 'blocked') {
    return (
      <div className={`flex min-h-[320px] w-full flex-col items-center justify-center rounded-lg border border-border bg-background p-6 text-center ${className || ''}`}>
        <AlertCircle className="mb-3 h-10 w-10 text-amber-500" />
        <h3 className="mb-2 text-lg font-semibold">This website does not allow embedding.</h3>
        <p className="mb-4 max-w-md text-sm text-muted-foreground">
          {fallbackReason || 'The page blocks iframe display with browser security settings.'}
        </p>
        <Button onClick={() => window.open(targetUrl, '_blank', 'noopener,noreferrer')}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in New Tab
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative min-h-[640px] w-full overflow-hidden rounded-lg border border-border bg-background ${className || ''}`}>
      {(state === 'checking' || state === 'loading') && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {state === 'checking' ? 'Checking embed support...' : 'Loading external content...'}
          </p>
        </div>
      )}

      {embedUrl && (state === 'loading' || state === 'loaded') && (
        <iframe
          src={embedUrl}
          className={`h-[3000px] w-full border-0 bg-background ${state === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
          scrolling="no"
          title="Embedded Content"
          onLoad={() => setState('loaded')}
          onError={() => {
            setFallbackReason('The browser blocked this iframe.');
            setState('blocked');
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
          sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-scripts allow-same-origin"
          loading="lazy"
        />
      )}
    </div>
  );
};
