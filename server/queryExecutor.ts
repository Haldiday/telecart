import { getSupabaseAdmin } from './lib/supabaseAdmin.js';
import type { AuditActionIntent, DbResponse, QueryFilter, QuerySpec } from './types/query.js';
import { calculateChanges, writeAuditLogsBestEffort, type AuditActor } from './lib/auditLog.js';
import { assertAllowedTable } from './lib/allowedTables.js';

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

export async function executeQuery(spec: QuerySpec, actor?: AuditActor, requestId?: string): Promise<DbResponse> {
  const table = spec.table;
  assertAllowedTable(table);

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
      if (actor && requestId) query = query.select('*');
      else if (spec.returning) query = query.select(spec.select ?? '*');
      if (spec.returning && !(actor && requestId)) query = applyLimitAndSingle(query, spec);
      const { data, error } = await query;
      if (!error && actor && requestId && spec.auditAction) {
        const rows = toRows(data);
        await writeAuditLogsBestEffort(rows.map((row) => ({
          actor,
          action: spec.auditAction,
          entityTable: table,
          recordId: row.id ? String(row.id) : null,
          newData: row,
          requestId,
        })));
      }
      if (!spec.returning && actor && requestId) return { data: null, error: formatError(error) };
      if (actor && requestId && spec.returning) {
        const rows = toRows(data);
        return {
          data: spec.single ? (rows[0] ?? null) : spec.maybeSingle ? (rows[0] ?? null) : rows,
          error: formatError(error),
        };
      }
      return { data, error: formatError(error) };
    }

    if (spec.action === 'update') {
      const oldRows = actor && requestId ? await selectAffectedRowsSafely(table, spec) : [];
      let query: any = getSupabaseAdmin().from(table).update(spec.body);
      query = applyFilters(query, spec.filters);
      if (spec.returning) {
        query = query.select(spec.select ?? '*');
        query = applyLimitAndSingle(query, spec);
      }
      const { data, error } = await query;
      if (!error && actor && requestId && spec.auditAction) {
        const newRows = await selectAffectedRowsSafely(table, spec);
        await auditUpdatedRows(table, oldRows, newRows, actor, requestId, spec.auditAction);
      }
      return { data, error: formatError(error) };
    }

    if (spec.action === 'delete') {
      const oldRows = actor && requestId ? await selectAffectedRowsSafely(table, spec) : [];
      let query: any = getSupabaseAdmin().from(table).delete();
      query = applyFilters(query, spec.filters);
      if (spec.returning) {
        query = query.select(spec.select ?? '*');
        query = applyLimitAndSingle(query, spec);
      }
      const { data, error } = await query;
      if (!error && actor && requestId && spec.auditAction) {
        await writeAuditLogsBestEffort(oldRows.map((row) => ({
          actor,
          action: spec.auditAction,
          entityTable: table,
          recordId: row.id ? String(row.id) : null,
          oldData: row,
          requestId,
        })));
      }
      return { data, error: formatError(error) };
    }

    if (spec.action === 'upsert') {
      const oldRows = actor && requestId ? await findExistingUpsertRows(table, spec) : [];
      let query: any = getSupabaseAdmin().from(table).upsert(spec.body, spec.onConflict ? { onConflict: spec.onConflict } : undefined);
      if (spec.returning) {
        query = query.select(spec.select ?? '*');
        query = applyLimitAndSingle(query, spec);
      }
      const { data, error } = await query;
      if (!error && actor && requestId && spec.auditAction) {
        const snapshotRows = await findExistingUpsertRows(table, spec);
        const newRows = snapshotRows.length > 0 ? snapshotRows : toRows(data);
        await writeAuditLogsBestEffort(newRows.flatMap((row) => {
          const old = oldRows.find((candidate) => candidate.id === row.id) ?? null;
          if (old && !calculateChanges(old, row)) return [];
          return [{
            actor,
            action: spec.auditAction,
            entityTable: table,
            recordId: row.id ? String(row.id) : null,
            oldData: old,
            newData: row,
            requestId,
          }];
        }));
      }
      return { data, error: formatError(error) };
    }

    return { data: null, error: { message: `Unsupported action: ${spec.action}` } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Query execution failed';
    return { data: null, error: { message } };
  }
}

function toRows(data: unknown): Record<string, any>[] {
  if (Array.isArray(data)) return data as Record<string, any>[];
  return data ? [data as Record<string, any>] : [];
}

async function selectAffectedRowsSafely(table: string, spec: QuerySpec): Promise<Record<string, any>[]> {
  try {
    let query: any = getSupabaseAdmin().from(table).select('*');
    query = applyFilters(query, spec.filters);
    const { data, error } = await query;
    if (error) throw error;
    return toRows(data);
  } catch (error) {
    console.error('[audit] Unable to snapshot affected rows', {
      table,
      error: error instanceof Error ? error.message : error,
    });
    return [];
  }
}

async function auditUpdatedRows(
  table: string,
  oldRows: Record<string, any>[],
  newRows: Record<string, any>[],
  actor: AuditActor,
  requestId: string,
  auditAction: AuditActionIntent,
) {
  await writeAuditLogsBestEffort(newRows.flatMap((row) => {
    const oldData = oldRows.find((old) => old.id === row.id) ?? null;
    if (oldData && !calculateChanges(oldData, row)) return [];
    return [{
      actor,
      action: auditAction,
      entityTable: table,
      recordId: row.id ? String(row.id) : null,
      oldData,
      newData: row,
      requestId,
    }];
  }));
}

async function findExistingUpsertRows(table: string, spec: QuerySpec): Promise<Record<string, any>[]> {
  const body = Array.isArray(spec.body) ? spec.body : spec.body ? [spec.body] : [];
  const ids = body.map((row: any) => row.id).filter(Boolean);
  if (ids.length > 0) {
    try {
      const { data, error } = await getSupabaseAdmin().from(table).select('*').in('id', ids);
      if (error) throw error;
      return toRows(data);
    } catch (error) {
      console.error('[audit] Unable to snapshot upsert rows', {
        table,
        error: error instanceof Error ? error.message : error,
      });
      return [];
    }
  }

  const conflictColumns = spec.onConflict?.split(',').map((column) => column.trim()).filter(Boolean) ?? [];
  if (conflictColumns.length === 0) return [];

  const rows: Record<string, any>[] = [];
  for (const bodyRow of body) {
    try {
      let query: any = getSupabaseAdmin().from(table).select('*').limit(1);
      for (const column of conflictColumns) query = query.eq(column, bodyRow[column]);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (data) rows.push(data);
    } catch (error) {
      console.error('[audit] Unable to snapshot conflict-key upsert row', {
        table,
        error: error instanceof Error ? error.message : error,
      });
    }
  }
  return rows;
}
