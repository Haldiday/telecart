import { Router } from 'express';
import { generateZohoPrefillToken, prefillZohoForm } from '../controllers/forms.js';
import { authenticateToken } from '../middlewares/jwt.js';

const router = Router();

router.post('/generate-token', authenticateToken, generateZohoPrefillToken);
router.get('/prefill', prefillZohoForm);
router.post('/prefill', prefillZohoForm);

export default router;
