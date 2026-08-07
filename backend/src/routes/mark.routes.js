import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as markController from '../controllers/mark.controller.js';
import {
  markCreateSchema,
  markUpdateSchema,
  markQuerySchema,
  markBulkSchema,
} from '../validators/mark.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

const canRead = authorize(ROLES.ADMIN, ROLES.TEACHER);
const canWrite = authorize(ROLES.ADMIN, ROLES.TEACHER);

router.get('/', canRead, validate({ query: markQuerySchema }), markController.listMarks);
router.get('/:id', canRead, validate({ params: idParamSchema }), markController.getMark);
router.post('/bulk', canWrite, validate({ body: markBulkSchema }), markController.bulkCreateMarks);
router.post('/', canWrite, validate({ body: markCreateSchema }), markController.createMark);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: markUpdateSchema }),
  markController.updateMark
);
router.delete('/:id', authorize(ROLES.ADMIN), validate({ params: idParamSchema }), markController.deleteMark);

export default router;
