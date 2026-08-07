import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as feeController from '../controllers/fee.controller.js';
import { feeCreateSchema, feeUpdateSchema, feeQuerySchema } from '../validators/fee.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

const canRead = authorize(ROLES.ADMIN);
const canWrite = authorize(ROLES.ADMIN);

router.get('/', canRead, validate({ query: feeQuerySchema }), feeController.listFees);
router.get('/:id', canRead, validate({ params: idParamSchema }), feeController.getFee);
router.post('/', canWrite, validate({ body: feeCreateSchema }), feeController.createFee);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: feeUpdateSchema }),
  feeController.updateFee
);
router.delete('/:id', canWrite, validate({ params: idParamSchema }), feeController.deleteFee);

export default router;
