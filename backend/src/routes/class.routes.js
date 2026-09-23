import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../constants/permissions.js';
import validate from '../middleware/validate.js';
import * as classController from '../controllers/class.controller.js';
import { classCreateSchema, classUpdateSchema, classQuerySchema } from '../validators/class.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.CLASSES_VIEW), validate({ query: classQuerySchema }), classController.listClasses);
router.post('/rebalance-sections', requirePermission(PERMISSIONS.CLASSES_UPDATE), classController.rebalanceSections);
router.get('/:id', requirePermission(PERMISSIONS.CLASSES_VIEW), validate({ params: idParamSchema }), classController.getClass);
router.post('/', requirePermission(PERMISSIONS.CLASSES_CREATE), validate({ body: classCreateSchema }), classController.createClass);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.CLASSES_UPDATE),
  validate({ params: idParamSchema, body: classUpdateSchema }),
  classController.updateClass
);
router.delete('/:id', requirePermission(PERMISSIONS.CLASSES_DELETE), validate({ params: idParamSchema }), classController.deleteClass);

export default router;
