import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../constants/permissions.js';
import validate from '../middleware/validate.js';
import * as studentController from '../controllers/student.controller.js';
import {
  studentCreateSchema,
  studentUpdateSchema,
  studentQuerySchema,
  studentResetCredentialsSchema,
} from '../validators/student.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.STUDENTS_VIEW), validate({ query: studentQuerySchema }), studentController.listStudents);
router.get('/promotion-history', requirePermission(PERMISSIONS.STUDENTS_VIEW), studentController.getPromotionHistory);
router.post('/promote', requirePermission(PERMISSIONS.PROMOTION_MANAGE), studentController.promoteStudents);
router.get('/:id', requirePermission(PERMISSIONS.STUDENTS_VIEW), validate({ params: idParamSchema }), studentController.getStudent);
router.post('/', requirePermission(PERMISSIONS.STUDENTS_CREATE), validate({ body: studentCreateSchema }), studentController.createStudent);
router.post(
  '/:id/credentials',
  requirePermission(PERMISSIONS.STUDENTS_UPDATE),
  validate({ params: idParamSchema, body: studentResetCredentialsSchema }),
  studentController.resetStudentCredentials
);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.STUDENTS_UPDATE),
  validate({ params: idParamSchema, body: studentUpdateSchema }),
  studentController.updateStudent
);
router.delete('/:id', requirePermission(PERMISSIONS.STUDENTS_DELETE), validate({ params: idParamSchema }), studentController.deleteStudent);

export default router;
