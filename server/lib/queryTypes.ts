export type FilterOp = 'eq' | 'neq' | 'in' | 'is' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'or';

export interface QueryFilter {
  column: string;
  op: FilterOp;
  value: unknown;
}

export interface QueryOrder {
  column: string;
  ascending?: boolean;
  foreignTable?: string;
}

export interface SelectBody {
  table: string;
  select: string;
  filters: QueryFilter[];
  orders: QueryOrder[];
  limit?: number;
  single?: boolean;
  maybeSingle?: boolean;
  count?: 'exact';
  head?: boolean;
}

export interface MutateBody {
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'upsert';
  payload?: unknown;
  filters: QueryFilter[];
  select?: string;
  single?: boolean;
  maybeSingle?: boolean;
  upsertOptions?: { onConflict?: string; ignoreDuplicates?: boolean };
}
