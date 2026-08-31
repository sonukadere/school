import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as parentController from '../controllers/parent.controller.js';
import { parentCreateSchema, parentUpdateSchema, parentQuerySchema } from '../validators/parent.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

// Parents management is restricted to admins. Students/Parents access
// their own data through /api/me endpoints.
const canWrite = authorize(ROLES.ADMIN);

router.get('/', canWrite, validate({ query: parentQuerySchema }), parentController.listParents);
router.get('/:id', canWrite, validate({ params: idParamSchema }), parentController.getParent);
router.post('/', canWrite, validate({ body: parentCreateSchema }), parentController.createParent);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: parentUpdateSchema }),
  parentController.updateParent
);
router.delete('/:id', canWrite, validate({ params: idParamSchema }), parentController.deleteParent);

export default router;
