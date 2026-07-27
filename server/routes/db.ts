import { Router } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import { executeQuery } from '../queryExecutor.js';
import type { QuerySpec } from '../types/query.js';

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

  const result = await executeQuery({
    ...spec,
    filters: spec.filters ?? [],
    orders: spec.orders ?? [],
  });

  if (result.error) {
    res.status(400).json(result);
    return;
  }

  res.json(result);
});

dbRouter.get('/auth/admin-check', requireAdmin, (req: AuthenticatedRequest, res) => {
  res.json({ data: { isAdmin: true, userId: req.userId }, error: null });
});
