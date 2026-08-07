import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as teacherController from '../controllers/teacher.controller.js';
import {
  teacherCreateSchema,
  teacherUpdateSchema,
  teacherQuerySchema,
} from '../validators/teacher.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

const canRead = authorize(ROLES.ADMIN, ROLES.TEACHER);
const canWrite = authorize(ROLES.ADMIN);

router.get('/', canRead, validate({ query: teacherQuerySchema }), teacherController.listTeachers);
router.get('/:id', canRead, validate({ params: idParamSchema }), teacherController.getTeacher);
router.post('/', canWrite, validate({ body: teacherCreateSchema }), teacherController.createTeacher);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: teacherUpdateSchema }),
  teacherController.updateTeacher
);
router.delete('/:id', canWrite, validate({ params: idParamSchema }), teacherController.deleteTeacher);

export default router;
