import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as staffController from '../controllers/staff.controller.js';
import { staffCreateSchema, staffUpdateSchema, staffQuerySchema } from '../validators/staff.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

// Staff management is admin-only. Staff accounts access their own data
// through /api/me endpoints.
const canWrite = authorize(ROLES.ADMIN);

router.get('/', canWrite, validate({ query: staffQuerySchema }), staffController.listStaff);
router.get('/:id', canWrite, validate({ params: idParamSchema }), staffController.getStaff);
router.post('/', canWrite, validate({ body: staffCreateSchema }), staffController.createStaff);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: staffUpdateSchema }),
  staffController.updateStaff
);
router.delete('/:id', canWrite, validate({ params: idParamSchema }), staffController.deleteStaff);

export default router;
