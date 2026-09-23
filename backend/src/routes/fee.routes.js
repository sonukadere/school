import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../constants/permissions.js';
import validate from '../middleware/validate.js';
import * as feeController from '../controllers/fee.controller.js';
import { feeCreateSchema, feeUpdateSchema, feeQuerySchema } from '../validators/fee.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.FEES_VIEW), validate({ query: feeQuerySchema }), feeController.listFees);
router.get('/:id', requirePermission(PERMISSIONS.FEES_VIEW), validate({ params: idParamSchema }), feeController.getFee);
router.post('/', requirePermission(PERMISSIONS.FEES_CREATE), validate({ body: feeCreateSchema }), feeController.createFee);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.FEES_UPDATE),
  validate({ params: idParamSchema, body: feeUpdateSchema }),
  feeController.updateFee
);
router.delete('/:id', requirePermission(PERMISSIONS.FEES_DELETE), validate({ params: idParamSchema }), feeController.deleteFee);

export default router;
