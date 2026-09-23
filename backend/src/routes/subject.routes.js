import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../constants/permissions.js';
import validate from '../middleware/validate.js';
import * as subjectController from '../controllers/subject.controller.js';
import {
  subjectCreateSchema,
  subjectUpdateSchema,
  subjectQuerySchema,
} from '../validators/subject.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.SUBJECTS_VIEW), validate({ query: subjectQuerySchema }), subjectController.listSubjects);
router.get('/:id', requirePermission(PERMISSIONS.SUBJECTS_VIEW), validate({ params: idParamSchema }), subjectController.getSubject);
router.post('/', requirePermission(PERMISSIONS.SUBJECTS_CREATE), validate({ body: subjectCreateSchema }), subjectController.createSubject);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.SUBJECTS_UPDATE),
  validate({ params: idParamSchema, body: subjectUpdateSchema }),
  subjectController.updateSubject
);
router.delete('/:id', requirePermission(PERMISSIONS.SUBJECTS_DELETE), validate({ params: idParamSchema }), subjectController.deleteSubject);

export default router;
