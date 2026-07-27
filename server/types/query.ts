export type FilterOp = 'eq' | 'neq' | 'in' | 'is' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'or';

export interface QueryFilter {
  op: FilterOp;
  column: string;
  value: unknown;
}

export interface QueryOrder {
  column: string;
  options?: {
    ascending?: boolean;
    foreignTable?: string;
    nullsFirst?: boolean;
  };
}

export type QueryAction = 'select' | 'insert' | 'update' | 'delete' | 'upsert';

export interface QuerySpec {
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
