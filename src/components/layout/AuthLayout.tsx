import { Outlet, useLocation, useNavigationType } from "react-router-dom";
import { SearchProvider } from "@/contexts/SearchContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useEffect, useLayoutEffect, useRef } from "react";

export const AuthLayout = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollPositionsRef = useRef(new Map<string, { x: number; y: number }>());
  const activeLocationKeyRef = useRef(location.key);

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    const saveScrollPosition = () => {
      scrollPositionsRef.current.set(activeLocationKeyRef.current, {
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    saveScrollPosition();
    window.addEventListener("scroll", saveScrollPosition, { passive: true });
    return () => window.removeEventListener("scroll", saveScrollPosition);
  }, []);

  useLayoutEffect(() => {
    const previousLocationKey = activeLocationKeyRef.current;
    if (previousLocationKey !== location.key) {
      activeLocationKeyRef.current = location.key;
    }

    if (location.hash.startsWith('#section-')) return;

    if (navigationType === "POP") {
      const savedPosition = scrollPositionsRef.current.get(location.key);
      if (!savedPosition) return;

      const restorationStartedAt = performance.now();
      const restorationTimeout = 5000;
      const stabilizationWindow = 750;
      let lastLayoutChangeAt = restorationStartedAt;
      let restorationTimer: number | null = null;
      let settleTimer: number | null = null;
      let resizeObserver: ResizeObserver | null = null;
      let stopped = false;

      const getMaxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const restore = () => {
        const maxScroll = getMaxScroll();
        const targetY = Math.min(savedPosition.y, maxScroll);
        window.scrollTo({ left: savedPosition.x, top: targetY, behavior: "auto" });
      };
      const stop = () => {
        if (stopped) return;
        stopped = true;
        if (restorationTimer !== null) window.clearTimeout(restorationTimer);
        if (settleTimer !== null) window.clearTimeout(settleTimer);
        resizeObserver?.disconnect();
      };
      const scheduleCheck = (delay: number) => {
        if (stopped) return;
        if (restorationTimer !== null) window.clearTimeout(restorationTimer);
        restorationTimer = window.setTimeout(checkLayout, delay);
      };
      const markLayoutChanged = () => {
        lastLayoutChangeAt = performance.now();
        if (settleTimer !== null) window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(checkLayout, stabilizationWindow);
        scheduleCheck(0);
      };
      const checkLayout = () => {
        if (stopped) return;

        const now = performance.now();
        const maxScroll = getMaxScroll();
        const homeReady = location.pathname !== '/' || document.querySelector('[data-scroll-ready="home"]');
        const targetReachable = maxScroll >= savedPosition.y;

        if (homeReady && targetReachable) {
          restore();
        }

        if (now - restorationStartedAt >= restorationTimeout) {
          restore();
          stop();
          return;
        }

        if (homeReady && targetReachable && now - lastLayoutChangeAt >= stabilizationWindow) {
          restore();
          stop();
          return;
        }

        scheduleCheck(100);
      };

      const observeHomeLayout = () => {
        const homeContainer = document.querySelector('[data-scroll-container="home"]');
        if (homeContainer) {
          resizeObserver = new ResizeObserver(markLayoutChanged);
          resizeObserver.observe(homeContainer);
        }
        checkLayout();
      };

      observeHomeLayout();
      return stop;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.hash, location.key, location.pathname, navigationType]);

  return (
    <AuthProvider>
      <SearchProvider>
        <Outlet />
      </SearchProvider>
    </AuthProvider>
  );
};
