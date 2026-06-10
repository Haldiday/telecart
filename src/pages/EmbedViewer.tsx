import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { checkEmbedSupport, getSmartEmbedUrl, normalizeExternalUrl } from '@/lib/smart-embed';

type ViewerState = 'checking' | 'loading' | 'loaded' | 'blocked';

const LOAD_TIMEOUT_MS = 8000;

export default function EmbedViewer() {
  const [searchParams] = useSearchParams();
  const rawUrl = searchParams.get('url');
  const autoRedirect = searchParams.get('redirect') === '1';
  const targetUrl = useMemo(() => normalizeExternalUrl(rawUrl), [rawUrl]);
  const [embedUrl, setEmbedUrl] = useState<string | null>(targetUrl ? getSmartEmbedUrl(targetUrl) : null);
  const [viewerState, setViewerState] = useState<ViewerState>(targetUrl ? 'checking' : 'blocked');
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!targetUrl) {
      setViewerState('blocked');
      setFallbackReason('No valid external URL was provided.');
      return;
    }

    const controller = new AbortController();
    setViewerState('checking');
    setFallbackReason(null);
    setEmbedUrl(getSmartEmbedUrl(targetUrl));

    checkEmbedSupport(targetUrl, controller.signal).then((result) => {
      if (controller.signal.aborted) return;

      setEmbedUrl(result.embedUrl);
      if (result.status === 'blocked') {
        setFallbackReason(result.reason || 'This website does not allow embedding.');
        setViewerState('blocked');
        if (autoRedirect) window.location.assign(targetUrl);
        return;
      }

      setViewerState('loading');
    });

    return () => controller.abort();
  }, [autoRedirect, targetUrl]);

  useEffect(() => {
    if (viewerState !== 'loading') return;

    const timer = window.setTimeout(() => {
      setFallbackReason('The embedded page did not load in time.');
      setViewerState('blocked');
      if (autoRedirect && targetUrl) window.location.assign(targetUrl);
    }, LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [autoRedirect, targetUrl, viewerState]);

  const handleLoad = () => {
    setViewerState('loaded');
  };

  const handleOpenNewTab = () => {
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const isBusy = viewerState === 'checking' || viewerState === 'loading';
  const shouldRenderIframe = Boolean(embedUrl && (viewerState === 'loading' || viewerState === 'loaded'));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-[calc(100vh-140px)] flex-1 bg-background">
          {isBusy && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
              
            </div>
          )}

          {viewerState === 'blocked' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background p-4 text-center">
              <AlertCircle className="mb-4 h-12 w-12 text-amber-500" />
              <h1 className="mb-2 text-2xl font-bold">This website does not allow embedding.</h1>
              <p className="mb-6 max-w-md text-muted-foreground">
                {fallbackReason || 'The page blocks iframe display with browser security settings.'}
              </p>
              {targetUrl ? (
                <Button onClick={handleOpenNewTab}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in New Tab
                </Button>
              ) : (
                <Button onClick={() => window.history.back()}>Go Back</Button>
              )}
            </div>
          )}

          {shouldRenderIframe && (
            <iframe
              ref={iframeRef}
              src={embedUrl || undefined}
              className={`h-full min-h-[calc(100vh-140px)] w-full border-0 bg-background ${
                viewerState === 'loaded' ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleLoad}
              onError={() => {
                setFallbackReason('The browser blocked this iframe.');
                setViewerState('blocked');
              }}
              title="External Content"
              sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-scripts allow-same-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
