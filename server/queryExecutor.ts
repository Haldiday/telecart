import { getSupabaseAdmin } from './lib/supabaseAdmin.js';
import type { DbResponse, QueryFilter, QuerySpec } from './types/query.js';

function applyFilters(query: any, filters: QueryFilter[]): any {
  let result = query;
  for (const filter of filters) {
    switch (filter.op) {
      case 'eq':
        result = result.eq(filter.column, filter.value);
        break;
      case 'neq':
        result = result.neq(filter.column, filter.value);
        break;
      case 'in':
        result = result.in(filter.column, filter.value);
        break;
      case 'is':
        result = result.is(filter.column, filter.value);
        break;
      case 'gt':
        result = result.gt(filter.column, filter.value);
        break;
      case 'gte':
        result = result.gte(filter.column, filter.value);
        break;
      case 'lt':
        result = result.lt(filter.column, filter.value);
        break;
      case 'lte':
        result = result.lte(filter.column, filter.value);
        break;
      case 'like':
        result = result.like(filter.column, filter.value);
        break;
      case 'ilike':
        result = result.ilike(filter.column, filter.value);
        break;
      case 'or':
        result = result.or(filter.value as string);
        break;
      default:
        throw new Error(`Unsupported filter operation: ${filter.op}`);
    }
  }
  return result;
}

function applyOrders(query: any, spec: QuerySpec): any {
  let result = query;
  for (const order of spec.orders) {
    result = result.order(order.column, order.options);
  }
  return result;
}

function applyLimitAndSingle(query: any, spec: QuerySpec): any {
  let result = query;
  if (spec.limit != null) {
    result = result.limit(spec.limit);
  }
  if (spec.single) {
    result = result.single();
  } else if (spec.maybeSingle) {
    result = result.maybeSingle();
  }
  return result;
}

function formatError(error: { message: string; code?: string; details?: string } | null) {
  if (!error) return null;
  return {
    message: error.message,
    code: error.code,
    details: error.details,
  };
}

export async function executeQuery(spec: QuerySpec): Promise<DbResponse> {
  const table = spec.table;

  try {
    if (spec.action === 'select') {
      let query = getSupabaseAdmin().from(table).select(spec.select ?? '*', spec.selectOptions);
      query = applyFilters(query, spec.filters);
      query = applyOrders(query, spec);
      query = applyLimitAndSingle(query, spec);

      const { data, error, count } = await query;
      return { data, error: formatError(error), count: count ?? null };
    }

    if (spec.action === 'insert') {
      let query: any = getSupabaseAdmin().from(table).insert(spec.body);
      if (spec.returning) {
        query = query.select(spec.select ?? '*');
        query = applyLimitAndSingle(query, spec);
      }
      const { data, error } = await query;
      return { data, error: formatError(error) };
    }

    if (spec.action === 'update') {
      let query: any = getSupabaseAdmin().from(table).update(spec.body);
      query = applyFilters(query, spec.filters);
      if (spec.returning) {
        query = query.select(spec.select ?? '*');
        query = applyLimitAndSingle(query, spec);
      }
      const { data, error } = await query;
      return { data, error: formatError(error) };
    }

    if (spec.action === 'delete') {
      let query: any = getSupabaseAdmin().from(table).delete();
      query = applyFilters(query, spec.filters);
      if (spec.returning) {
        query = query.select(spec.select ?? '*');
        query = applyLimitAndSingle(query, spec);
      }
      const { data, error } = await query;
      return { data, error: formatError(error) };
    }

    if (spec.action === 'upsert') {
      let query: any = getSupabaseAdmin().from(table).upsert(spec.body);
      if (spec.returning) {
        query = query.select(spec.select ?? '*');
        query = applyLimitAndSingle(query, spec);
      }
      const { data, error } = await query;
      return { data, error: formatError(error) };
    }

    return { data: null, error: { message: `Unsupported action: ${spec.action}` } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Query execution failed';
    return { data: null, error: { message } };
  }
}
