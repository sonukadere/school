import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../constants/permissions.js';
import validate from '../middleware/validate.js';
import * as teacherController from '../controllers/teacher.controller.js';
import {
  teacherCreateSchema,
  teacherUpdateSchema,
  teacherQuerySchema,
  teacherResetCredentialsSchema,
} from '../validators/teacher.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.TEACHERS_VIEW), validate({ query: teacherQuerySchema }), teacherController.listTeachers);
router.get('/:id', requirePermission(PERMISSIONS.TEACHERS_VIEW), validate({ params: idParamSchema }), teacherController.getTeacher);
router.post('/', requirePermission(PERMISSIONS.TEACHERS_CREATE), validate({ body: teacherCreateSchema }), teacherController.createTeacher);
router.post(
  '/:id/credentials',
  requirePermission(PERMISSIONS.TEACHERS_UPDATE),
  validate({ params: idParamSchema, body: teacherResetCredentialsSchema }),
  teacherController.resetTeacherCredentials
);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.TEACHERS_UPDATE),
  validate({ params: idParamSchema, body: teacherUpdateSchema }),
  teacherController.updateTeacher
);
router.delete('/:id', requirePermission(PERMISSIONS.TEACHERS_DELETE), validate({ params: idParamSchema }), teacherController.deleteTeacher);

export default router;
