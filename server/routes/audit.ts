import { Router } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import {
  buildDisplayDescriptionFromRecord,
  buildHierarchyDisplay,
  createAuditLog,
  getAuditLogsByModule,
} from '../services/audit.js';
import type { AuditLogRecord, AuditModule, CreateAuditLogRequest } from '../types/audit.js';

const router = Router();

const VALID_MODULES = new Set<AuditModule>([
  'section-headings',
  'categories',
  'subcategories',
  'brands',
  'brand-action-links',
  'ads',
  'offers',
  'featured-cards',
]);

const VALID_ACTIONS = new Set(['create', 'update', 'delete']);

router.post('/record', requireAdmin, async (req: AuthenticatedRequest, res) => {
  const body = req.body as CreateAuditLogRequest & { correlation_id?: string };

  if (!body?.module || !VALID_MODULES.has(body.module as AuditModule)) {
    res.status(400).json({ data: null, error: { message: 'Invalid audit module' } });
    return;
  }
  if (!body?.action || !VALID_ACTIONS.has(body.action)) {
    res.status(400).json({ data: null, error: { message: 'Invalid audit action' } });
    return;
  }
  if (!body?.entity_type || !body?.entity_name) {
    res.status(400).json({ data: null, error: { message: 'entity_type and entity_name are required' } });
    return;
  }
  if (!req.userId) {
    res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
    return;
  }

  try {
    const created = await createAuditLog(req.userId, body);
    if (!created) {
      res.status(500).json({ data: null, error: { message: 'Failed to record audit' } });
      return;
    }
    res.json({ data: { id: created.id }, error: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to record audit';
    res.status(500).json({ data: null, error: { message: msg } });
  }
});

router.get(['/logs', '/logs/:module'], requireAdmin, async (req: AuthenticatedRequest, res) => {
  const module = (req.params.module ?? req.query.module) as AuditModule;
  if (!VALID_MODULES.has(module)) {
    res.status(400).json({ data: null, error: { message: 'Invalid audit module' } });
    return;
  }

  const rawLimit = Number((req.query.limit as string) ?? '200');
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 500 ? rawLimit : 200;

  try {
    const logs = await getAuditLogsByModule(module, limit);
    const enriched = logs.map((log: AuditLogRecord) => ({
      id: log.id,
      actor_name: log.actor_name,
      actor_avatar: log.actor_avatar,
      actor_id: log.actor_id ?? log.actor_user_id,
      module: log.module,
      action: log.action,
      entity_type: log.entity_type ?? log.entity_table,
      entity_id: log.entity_id,
      entity_name: log.entity_name,
      ad_slot: log.ad_slot,
      hierarchy: log.hierarchy,
      description: buildDisplayDescriptionFromRecord(log),
      hierarchy_path: buildHierarchyDisplay(log.hierarchy ?? {}),
      created_at: log.created_at,
    }));
    res.json({ data: enriched, error: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch audit logs';
    res.status(500).json({ data: null, error: { message: msg } });
  }
});

export default router;
