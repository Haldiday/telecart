import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireAuthenticationBeforeOpeningLink, resumePendingAuthDestination, setStoredPendingAuthDestination } from './authGuard';

function createStorage() {
  const store = new Map<string, string>();
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

describe('authGuard', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: createStorage(), configurable: true });
    Object.defineProperty(window, 'sessionStorage', { value: createStorage(), configurable: true });
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('stores a pending destination and redirects unauthenticated users to login', () => {
    const navigate = vi.fn();

    const allowed = requireAuthenticationBeforeOpeningLink({
      destination: '/protected-page',
      type: 'brandAction',
      entityId: 'brand-1',
      pathname: '/category/1',
      search: '?foo=bar',
      hash: '#section',
      navigate,
    });

    expect(allowed).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/login', { replace: false });

    const pending = window.sessionStorage.getItem('pending_auth_destination');
    expect(pending).toContain('"destination":"/protected-page"');
    expect(pending).toContain('"type":"brandAction"');
  });

  it('resumes the stored destination after login', () => {
    setStoredPendingAuthDestination({
      type: 'brandAction',
      destination: '/protected-page',
      pathname: '/category/1',
      search: '?foo=bar',
      hash: '#section',
      entityId: 'brand-1',
    });

    const navigate = vi.fn();
    const resumed = resumePendingAuthDestination({ navigate });

    expect(resumed).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/category/1?foo=bar#section', { replace: true });
    expect(window.sessionStorage.getItem('pending_auth_destination')).toBeNull();
  });
});
