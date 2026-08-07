type FilterOp = 'eq' | 'neq' | 'in' | 'is' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'or';

interface QueryFilter {
  op: FilterOp;
  column: string;
  value: unknown;
}

interface QueryOrder {
  column: string;
  options?: {
    ascending?: boolean;
    foreignTable?: string;
    nullsFirst?: boolean;
  };
}

type QueryAction = 'select' | 'insert' | 'update' | 'delete' | 'upsert';

interface QuerySpec {
  table: string;
  action: QueryAction;
  select?: string;
  selectOptions?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean };
  filters: QueryFilter[];
  orders: QueryOrder[];
  limit?: number;
  single?: boolean;
  maybeSingle?: boolean;
  body?: unknown;
  returning?: boolean;
}

export interface DbResponse<T = unknown> {
  data: T | null;
  error: { message: string; code?: string; details?: string } | null;
  count?: number | null;
}

type AuthTokenProvider = () => Promise<string | null>;

// Prefer VITE_API_URL in development when configured; otherwise use localhost for local dev.
// In production, always use the relative API base path.
const API_BASE = import.meta.env.PROD ? '' : import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

let authTokenProvider: AuthTokenProvider = async () => null;

export function setAuthTokenProvider(provider: AuthTokenProvider) {
  authTokenProvider = provider;
}

async function executeQuery<T = unknown>(spec: QuerySpec): Promise<DbResponse<T>> {
  const token = await authTokenProvider();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/db/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify(spec),
    cache: 'no-store',
  });

  const payload = (await response.json()) as DbResponse<T>;
  return payload;
}

class ApiQueryBuilder<T = unknown> implements PromiseLike<DbResponse<T>> {
  private spec: QuerySpec;

  constructor(table: string) {
    this.spec = {
      table,
      action: 'select',
      filters: [],
      orders: [],
    };
  }

  select(
    columns?: string,
    options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean },
  ): this {
    if (this.spec.action === 'select') {
      this.spec.select = columns ?? '*';
      this.spec.selectOptions = options;
    } else {
      this.spec.returning = true;
      this.spec.select = columns ?? '*';
    }
    return this;
  }

  insert(body: unknown): this {
    this.spec.action = 'insert';
    this.spec.body = body;
    return this;
  }

  update(body: unknown): this {
    this.spec.action = 'update';
    this.spec.body = body;
    return this;
  }

  upsert(body: unknown): this {
    this.spec.action = 'upsert';
    this.spec.body = body;
    return this;
  }

  delete(): this {
    this.spec.action = 'delete';
    return this;
  }

  eq(column: string, value: unknown): this {
    this.spec.filters.push({ op: 'eq', column, value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.spec.filters.push({ op: 'neq', column, value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.spec.filters.push({ op: 'in', column, value: values });
    return this;
  }

  is(column: string, value: unknown): this {
    this.spec.filters.push({ op: 'is', column, value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.spec.filters.push({ op: 'gt', column, value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.spec.filters.push({ op: 'gte', column, value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.spec.filters.push({ op: 'lt', column, value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.spec.filters.push({ op: 'lte', column, value });
    return this;
  }

  like(column: string, value: string): this {
    this.spec.filters.push({ op: 'like', column, value });
    return this;
  }

  ilike(column: string, value: string): this {
    this.spec.filters.push({ op: 'ilike', column, value });
    return this;
  }

  or(value: string): this {
    this.spec.filters.push({ op: 'or', column: '', value });
    return this;
  }

  order(
    column: string,
    options?: {
      ascending?: boolean;
      foreignTable?: string;
      nullsFirst?: boolean;
    },
  ): this {
    this.spec.orders.push({ column, options });
    return this;
  }

  limit(count: number): this {
    this.spec.limit = count;
    return this;
  }

  single(): this {
    this.spec.single = true;
    return this;
  }

  maybeSingle(): this {
    this.spec.maybeSingle = true;
    return this;
  }

  then<TResult1 = DbResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: DbResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return executeQuery<T>(this.spec).then(onfulfilled, onrejected);
  }
}

class ApiStorageBucket {
  constructor(private bucket: string) { }

  async upload(path: string, file: File, _options?: { contentType?: string; upsert?: boolean }) {
    const token = await authTokenProvider();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/storage/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const payload = await response.json();
    if (payload.error) {
      return { data: null, error: payload.error };
    }

    return { data: { path: payload.data.path, fullPath: payload.data.path }, error: null };
  }

  async remove(paths: string[]) {
    const token = await authTokenProvider();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/storage/remove`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ bucket: this.bucket, paths }),
    });

    const payload = await response.json();
    return { data: payload.data, error: payload.error };
  }

  getPublicUrl(path: string) {
    const publicUrlBase = import.meta.env.VITE_R2_PUBLIC_URL;
    if (!publicUrlBase) {
      throw new Error('Missing VITE_R2_PUBLIC_URL environment variable');
    }

    const normalizedBase = publicUrlBase.replace(/\/+$/, '');
    const encodedPath = path
      .replace(/^\/+/, '')
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    const publicUrl = `${normalizedBase}/${encodedPath}`;
    return { data: { publicUrl } };
  }
}

export function createApiDbClient() {
  return {
    from<T = unknown>(table: string) {
      return new ApiQueryBuilder<T>(table);
    },
    storage: {
      from(bucket: string) {
        return new ApiStorageBucket(bucket);
      },
    },
  };
}

export type ApiDbClient = ReturnType<typeof createApiDbClient>;
