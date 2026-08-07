import { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

export interface PendingAuthDestination {
  type: string;
  destination?: string | null;
  pathname?: string;
  search?: string;
  hash?: string;
  entityId?: string | null;
  externalUrl?: string | null;
  pendingVideoUrl?: string | null;
}

const PENDING_AUTH_DESTINATION_KEY = 'pending_auth_destination';

export function getStoredPendingAuthDestination(): PendingAuthDestination | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(PENDING_AUTH_DESTINATION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PendingAuthDestination;
  } catch {
    return null;
  }
}

export function setStoredPendingAuthDestination(destination: PendingAuthDestination | null) {
  if (typeof window === 'undefined') return;

  if (!destination) {
    window.sessionStorage.removeItem(PENDING_AUTH_DESTINATION_KEY);
    return;
  }

  window.sessionStorage.setItem(PENDING_AUTH_DESTINATION_KEY, JSON.stringify(destination));
}

export function clearStoredPendingAuthDestination() {
  setStoredPendingAuthDestination(null);
}

export function resumePendingAuthDestination(options?: {
  navigate?: (path: string, options?: { replace?: boolean }) => void;
}) {
  const pendingDestination = getStoredPendingAuthDestination();
  if (!pendingDestination) return false;

  clearStoredPendingAuthDestination();

  if (typeof window === 'undefined') return false;

  const navigate = options?.navigate;
  if (pendingDestination.pendingVideoUrl && pendingDestination.pathname) {
    const url = new URL(pendingDestination.pathname, window.location.origin);
    if (pendingDestination.search) {
      url.search = pendingDestination.search;
    }
    const params = new URLSearchParams(url.search);
    params.set('pending_video_url', pendingDestination.pendingVideoUrl);
    url.search = params.toString();
    if (pendingDestination.hash) {
      url.hash = pendingDestination.hash;
    }

    const resumePath = `${url.pathname}${url.search ? `?${url.search}` : ''}${url.hash}`;
    if (navigate) {
      navigate(resumePath, { replace: true });
      return true;
    }

    window.location.assign(url.toString());
    return true;
  }

  const targetPath = pendingDestination.pathname
    ? `${pendingDestination.pathname}${pendingDestination.search ?? ''}${pendingDestination.hash ?? ''}`
    : pendingDestination.destination;

  if (targetPath) {
    if (targetPath.startsWith('http://') || targetPath.startsWith('https://') || targetPath.startsWith('//')) {
      window.location.assign(targetPath);
      return true;
    }

    if (navigate) {
      navigate(targetPath, { replace: true });
      return true;
    }

    window.location.assign(targetPath.startsWith('/') ? targetPath : `/${targetPath}`);
    return true;
  }

  if (navigate) {
    navigate('/', { replace: true });
    return true;
  }

  window.location.assign('/');
  return true;
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem('auth_token'));
}

export function logoutAndRedirectToHome(navigate: (path: string) => void, clearAuth?: () => Promise<void> | void) {
  const runLogout = async () => {
    if (clearAuth) {
      await clearAuth();
    }

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('auth_token');
      window.sessionStorage.removeItem('pending_auth_destination');
      window.sessionStorage.removeItem(PENDING_AUTH_DESTINATION_KEY);
    }

    navigate('/');
  };

  void runLogout();
}

export function requireAuthenticationBeforeOpeningLink(options: {
  destination?: string | null;
  fallbackPath?: string;
  navigate?: (path: string, options?: { replace?: boolean }) => void;
  onAuthenticated?: () => void;
  onUnauthenticated?: () => void;
  type?: string;
  entityId?: string | null;
  externalUrl?: string | null;
  pathname?: string;
  search?: string;
  hash?: string;
  pendingVideoUrl?: string | null;
}) {
  const { destination, fallbackPath, navigate, onAuthenticated, onUnauthenticated, type, entityId, externalUrl, pathname, search, hash } = options;

  if (isAuthenticated()) {
    if (onAuthenticated) {
      onAuthenticated();
    }
    return true;
  }

  const pendingDestination: PendingAuthDestination = {
    type: type ?? 'protected-link',
    destination: destination ?? fallbackPath ?? null,
    pathname,
    search,
    hash,
    entityId: entityId ?? null,
    externalUrl: externalUrl ?? null,
    pendingVideoUrl: options.pendingVideoUrl ?? null,
  };

  setStoredPendingAuthDestination(pendingDestination);

  if (onUnauthenticated) {
    onUnauthenticated();
  }

  if (navigate) {
    navigate('/login', { replace: false });
  }

  return false;
}

export function useAuthGuard() {
  const navigate = useNavigate();

  return {
    navigate,
    isAuthenticated,
    requireAuthenticationBeforeOpeningLink: (options: Parameters<typeof requireAuthenticationBeforeOpeningLink>[0]) =>
      requireAuthenticationBeforeOpeningLink({ ...options, navigate }),
    logoutAndRedirectToHome: (clearAuth?: () => Promise<void> | void) => logoutAndRedirectToHome(navigate, clearAuth),
  };
}

export const AuthGuardContext = createContext<ReturnType<typeof useAuthGuard> | null>(null);

export function useAuthGuardContext() {
  const context = useContext(AuthGuardContext);
  return context;
}
