import { Router } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import { executeQuery } from '../queryExecutor.js';
import type { QuerySpec } from '../types/query.js';
import { assertAllowedTable } from '../lib/allowedTables.js';
import { recordBrandActionLinkMutation } from '../services/audit.js';

const WRITE_ACTIONS = new Set(['insert', 'update', 'delete', 'upsert']);

export const dbRouter = Router();

dbRouter.post('/query', async (req: AuthenticatedRequest, res) => {
  const spec = req.body as QuerySpec;

  if (!spec?.table || !spec?.action) {
    res.status(400).json({
      data: null,
      error: { message: 'Invalid query spec: table and action are required' },
    });
    return;
  }

  try {
    assertAllowedTable(spec.table);
  } catch (error) {
    res.status(400).json({
      data: null,
      error: { message: error instanceof Error ? error.message : 'Table is not allowed' },
    });
    return;
  }

  if (WRITE_ACTIONS.has(spec.action)) {
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      res.status(401).json({
        data: null,
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
      });
      return;
    }
    if (!req.userId) {
      res.status(401).json({
        data: null,
        error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' },
      });
      return;
    }
    if (!req.isAdmin) {
      res.status(403).json({
        data: null,
        error: { message: 'Admin access required for write operations', code: 'FORBIDDEN' },
      });
      return;
    }
  }

  const isBrandActionLinkWrite = req.isAdmin && spec.table === 'subcategory_brands' && WRITE_ACTIONS.has(spec.action);
  const bodyRows = Array.isArray(spec.body) ? spec.body : spec.body ? [spec.body] : [];
  const bodyIds = bodyRows
    .map((row) => row && typeof row === 'object' ? (row as Record<string, unknown>).id : null)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
  const snapshotSpec = isBrandActionLinkWrite
    ? spec.action === 'insert' || spec.action === 'upsert'
      ? bodyIds.length > 0
        ? { table: spec.table, action: 'select' as const, select: '*', filters: [{ op: 'in' as const, column: 'id', value: bodyIds }], orders: [] }
        : null
      : { ...spec, action: 'select' as const, select: '*', returning: false, single: false, maybeSingle: false }
    : null;
  const before = snapshotSpec ? await executeQuery(snapshotSpec) : null;

  const result = await executeQuery({
    ...spec,
    filters: spec.filters ?? [],
    orders: spec.orders ?? [],
  });

  if (result.error) {
    res.status(400).json(result);
    return;
  }

  if (isBrandActionLinkWrite && req.userId) {
    const afterSpec = spec.action === 'delete'
      ? null
      : bodyIds.length > 0
        ? { table: spec.table, action: 'select' as const, select: '*', filters: [{ op: 'in' as const, column: 'id', value: bodyIds }], orders: [] }
        : snapshotSpec;
    const after = afterSpec ? await executeQuery(afterSpec) : { data: [], error: null };
    if (!before?.error && !after.error) {
      await recordBrandActionLinkMutation(
        req.userId,
        Array.isArray(before?.data) ? before.data as any[] : before?.data ? [before.data] as any[] : [],
        Array.isArray(after.data) ? after.data as any[] : after.data ? [after.data] as any[] : [],
      );
    }
  }

  res.json(result);
});

dbRouter.get('/auth/admin-check', requireAdmin, (req: AuthenticatedRequest, res) => {
  res.json({ data: { isAdmin: true, userId: req.userId }, error: null });
});
