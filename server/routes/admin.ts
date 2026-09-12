import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { searchExternalLinks } from '../controllers/adminLinkSearch.js';
import { getAdminAuditLogs } from '../controllers/adminAuditLogs.js';

const router = Router();

router.get('/link-search', requireAdmin, searchExternalLinks);
router.get('/audit-logs', requireAdmin, getAdminAuditLogs);

export default router;