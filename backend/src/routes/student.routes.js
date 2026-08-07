import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/index.js';
import * as studentController from '../controllers/student.controller.js';
import {
  studentCreateSchema,
  studentUpdateSchema,
  studentQuerySchema,
} from '../validators/student.schema.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();

router.use(authenticate);

const canRead = authorize(ROLES.ADMIN, ROLES.TEACHER);
const canWrite = authorize(ROLES.ADMIN);

router.get('/', canRead, validate({ query: studentQuerySchema }), studentController.listStudents);
router.get('/:id', canRead, validate({ params: idParamSchema }), studentController.getStudent);
router.post('/', canWrite, validate({ body: studentCreateSchema }), studentController.createStudent);
router.put(
  '/:id',
  canWrite,
  validate({ params: idParamSchema, body: studentUpdateSchema }),
  studentController.updateStudent
);
router.delete('/:id', canWrite, validate({ params: idParamSchema }), studentController.deleteStudent);

export default router;
