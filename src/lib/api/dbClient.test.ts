import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDbClient, setAuthTokenProvider } from './dbClient';

describe('createApiDbClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({ data: [], error: null }),
    }));
    setAuthTokenProvider(async () => null);
  });

  it('serializes chained or filters for search queries', async () => {
    const fetchMock = vi.mocked(fetch);
    const client = createApiDbClient();

    await client
      .from('page_sections')
      .select('id, heading, name')
      .eq('is_visible', true)
      .or('heading.ilike.%search%,name.ilike.%search%')
      .limit(20);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);

    expect(body.filters).toEqual([
      { op: 'eq', column: 'is_visible', value: true },
      { op: 'or', column: '', value: 'heading.ilike.%search%,name.ilike.%search%' },
    ]);
  });
});
