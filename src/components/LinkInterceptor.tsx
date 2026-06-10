import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmbedViewerUrl, normalizeExternalUrl } from '@/lib/smart-embed';

export const LinkInterceptor = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      // Find the closest anchor tag from the click target
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || anchor.hasAttribute('download')) return;

      if (window.location.pathname === '/embed') {
        return;
      }

      const externalUrl = normalizeExternalUrl(href);
      if (!externalUrl) return;

      try {
        const parsedUrl = new URL(externalUrl);

        if (parsedUrl.pathname === '/embed' && parsedUrl.origin === window.location.origin) return;

        event.preventDefault();
        event.stopPropagation();
        navigate(getEmbedViewerUrl(parsedUrl.toString()));
      } catch (e) {
        // If URL parsing fails, it's likely a relative internal link or invalid
        console.warn('LinkInterceptor: Failed to parse URL', href);
      }
    };

    // Use capture phase to intercept clicks before other handlers
    document.addEventListener('click', handleGlobalClick, true);

    // Also intercept window.open calls if possible
    const originalWindowOpen = window.open;
    window.open = (url?: string | URL, target?: string, features?: string) => {
      if (window.location.pathname === '/embed') {
        return originalWindowOpen.call(window, url, target, features);
      }

      const externalUrl = normalizeExternalUrl(url);
      if (externalUrl) {
        try {
          const parsedUrl = new URL(externalUrl);
          navigate(getEmbedViewerUrl(parsedUrl.toString()));
          return null;
        } catch (e) {
          // Fallback to original window.open
        }
      }
      return originalWindowOpen.call(window, url, target, features);
    };

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      window.open = originalWindowOpen;
    };
  }, [navigate]);

  return null; // This component doesn't render anything
};
